import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  WriteBatch,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  doc,
  docData,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Group } from '../shared/group.model';
import { User } from '../shared/user.model';

// Añadir un miembro cuesta una llamada exists() en firestore.rules y cada batch admite 20,
// así que los miembros se añaden en tandas de este tamaño.
const MEMBERS_PER_BATCH = 10;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// El grupo se creó pero no se pudo añadir a todos los miembros.
export class PartialGroupWriteError extends Error {
  constructor(readonly groupId: string, cause: unknown) {
    super('No se pudieron añadir todos los miembros del grupo', { cause });
  }
}

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  groupsForUser$(uid: string): Observable<Group[]> {
    const q = query(collection(this.firestore, 'groups'), where('memberUids', 'array-contains', uid));
    return this.inContext(() => collectionData(q, { idField: 'id' })) as Observable<Group[]>;
  }

  group$(groupId: string): Observable<Group | null> {
    return (this.inContext(() => docData(doc(this.firestore, 'groups', groupId), { idField: 'id' })) as Observable<
      Group | undefined
    >).pipe(map((group) => group ?? null));
  }

  userProfile$(uid: string): Observable<User | null> {
    return (this.inContext(() => docData(doc(this.firestore, 'users', uid))) as Observable<User | undefined>).pipe(
      map((user) => (user ? { ...user, uid } : null))
    );
  }

  // Cada escritura de miembros va en un batch junto a users/{uid}.groupIds, que es lo que
  // firestore.rules usa para dar acceso a los totales entre miembros (ver isValidGroupChange).
  // Cada tanda deja grupo y usuarios coherentes aunque falle una posterior.
  async createGroup(ownerUid: string, name: string, imageUrl: string | null, memberUids: string[]): Promise<string> {
    const ref = doc(collection(this.firestore, 'groups'));
    const [firstChunk = [], ...otherChunks] = chunk(
      [...new Set(memberUids)].filter((uid) => uid !== ownerUid),
      MEMBERS_PER_BATCH
    );

    const batch = writeBatch(this.firestore);
    batch.set(ref, {
      name: name.trim(),
      imageUrl,
      ownerUid,
      memberUids: [ownerUid, ...firstChunk],
      createdAt: serverTimestamp(),
    });
    [ownerUid, ...firstChunk].forEach((uid) => this.linkUser(batch, uid, ref.id));
    await batch.commit();

    try {
      for (const members of otherChunks) {
        await this.commitAddMembers(ref.id, members);
      }
    } catch (error) {
      throw new PartialGroupWriteError(ref.id, error);
    }
    return ref.id;
  }

  async addMembers(group: Group, uids: string[]): Promise<void> {
    const newMembers = [...new Set(uids)].filter((uid) => !group.memberUids.includes(uid));
    if (!group.id) {
      return;
    }
    for (const members of chunk(newMembers, MEMBERS_PER_BATCH)) {
      await this.commitAddMembers(group.id, members);
    }
  }

  private async commitAddMembers(groupId: string, members: string[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, 'groups', groupId), { memberUids: arrayUnion(...members) });
    members.forEach((uid) => this.linkUser(batch, uid, groupId));
    await batch.commit();
  }

  async removeMember(group: Group, uid: string): Promise<void> {
    if (!group.id) {
      return;
    }
    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, 'groups', group.id), { memberUids: arrayRemove(uid) });
    this.unlinkUser(batch, uid, group.id);
    await batch.commit();
  }

  // Quitar miembros no consume llamadas por miembro en las reglas: un único batch basta
  // (200 miembros + el grupo quedan lejos del máximo de 500 escrituras).
  async deleteGroup(group: Group): Promise<void> {
    if (!group.id) {
      return;
    }
    const batch = writeBatch(this.firestore);
    batch.delete(doc(this.firestore, 'groups', group.id));
    group.memberUids.forEach((uid) => this.unlinkUser(batch, uid, group.id!));
    await batch.commit();
  }

  private linkUser(batch: WriteBatch, uid: string, groupId: string): void {
    batch.update(doc(this.firestore, 'users', uid), { groupIds: arrayUnion(groupId), groupChange: groupId });
  }

  private unlinkUser(batch: WriteBatch, uid: string, groupId: string): void {
    batch.update(doc(this.firestore, 'users', uid), { groupIds: arrayRemove(groupId), groupChange: groupId });
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
