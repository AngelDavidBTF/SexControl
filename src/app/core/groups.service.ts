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
  // firestore.rules usa para dar acceso a los faps entre miembros (ver isValidGroupChange).
  async createGroup(ownerUid: string, name: string, imageUrl: string | null, memberUids: string[]): Promise<string> {
    const ref = doc(collection(this.firestore, 'groups'));
    const allMembers = [...new Set([ownerUid, ...memberUids])];
    const batch = writeBatch(this.firestore);

    batch.set(ref, {
      name: name.trim(),
      imageUrl,
      ownerUid,
      memberUids: allMembers,
      createdAt: serverTimestamp(),
    });
    allMembers.forEach((uid) => this.linkUser(batch, uid, ref.id));

    await batch.commit();
    return ref.id;
  }

  async addMembers(group: Group, uids: string[]): Promise<void> {
    const newMembers = uids.filter((uid) => !group.memberUids.includes(uid));
    if (!group.id || newMembers.length === 0) {
      return;
    }
    const batch = writeBatch(this.firestore);
    batch.update(doc(this.firestore, 'groups', group.id), { memberUids: arrayUnion(...newMembers) });
    newMembers.forEach((uid) => this.linkUser(batch, uid, group.id!));
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
