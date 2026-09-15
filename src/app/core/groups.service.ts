import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  deleteField,
  doc,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { FapCounts } from '../shared/fap.model';
import { Friend } from '../shared/friend.model';
import { Group, GroupMember } from '../shared/group.model';
import { PerUserStreams } from './per-user-streams';

// firestore.rules comprueba con un get() que cada miembro nuevo tiene al dueño como amigo, y
// una petición admite como máximo 10: los miembros se añaden en tandas de este tamaño.
const MEMBERS_PER_WRITE = 9;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export interface GroupOwner {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  counts: FapCounts;
}

// El grupo se creó pero no se pudo añadir a todos los miembros.
export class PartialGroupWriteError extends Error {
  constructor(readonly groupId: string, cause: unknown) {
    super('No se pudieron añadir todos los miembros del grupo', { cause });
  }
}

// Entrada inicial de un miembro. Para amigos sale de su entrada en social/{dueño}, que ya incluye
// los recuentos de semana y mes (y si oculta sus números), así los rankings por periodo son
// correctos desde el primer momento. Después la mantiene el propio miembro al sumar.
function memberFrom(
  user: { displayName: string | null; photoURL: string | null },
  counts: Partial<Pick<Friend, 'solitario' | 'compania' | 'week' | 'month' | 'hidden'>>
): GroupMember {
  return {
    displayName: user.displayName,
    photoURL: user.photoURL,
    solitario: counts.solitario ?? 0,
    compania: counts.compania ?? 0,
    week: counts.week ?? null,
    month: counts.month ?? null,
    hidden: counts.hidden === true,
  };
}

// Cada grupo guarda los totales de sus miembros en `members`: la lista de grupos es la única
// consulta (1 lectura por grupo) y la página de un grupo se sirve de ella sin leer nada más.
@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private streams = new PerUserStreams(authState(inject(Auth)));

  groupsForUser$(uid: string): Observable<Group[]> {
    return this.streams.get('groups', uid, () => {
      const q = query(collection(this.firestore, 'groups'), where('memberUids', 'array-contains', uid));
      return this.inContext(() => collectionData(q, { idField: 'id' })) as Observable<Group[]>;
    });
  }

  group$(uid: string, groupId: string): Observable<Group | null> {
    return this.groupsForUser$(uid).pipe(map((groups) => groups.find((group) => group.id === groupId) ?? null));
  }

  // Los totales iniciales de cada amigo salen de social/{dueño} (los mantiene cada amigo).
  async createGroup(owner: GroupOwner, name: string, imageUrl: string | null, friends: Friend[]): Promise<string> {
    const ref = doc(collection(this.firestore, 'groups'));
    const unique = [...new Map(friends.filter((f) => f.uid !== owner.uid).map((f) => [f.uid, f])).values()];
    const [firstChunk = [], ...otherChunks] = chunk(unique, MEMBERS_PER_WRITE);

    await setDoc(ref, {
      name: name.trim(),
      imageUrl,
      ownerUid: owner.uid,
      memberUids: [owner.uid, ...firstChunk.map((f) => f.uid)],
      members: {
        [owner.uid]: memberFrom(owner, owner.counts),
        ...Object.fromEntries(firstChunk.map((f) => [f.uid, memberFrom(f, f)])),
      },
      addedUids: firstChunk.map((f) => f.uid),
      createdAt: serverTimestamp(),
    });

    try {
      for (const members of otherChunks) {
        await this.writeNewMembers(ref.id, members);
      }
    } catch (error) {
      throw new PartialGroupWriteError(ref.id, error);
    }
    return ref.id;
  }

  async addMembers(group: Group, friends: Friend[]): Promise<void> {
    if (!group.id) {
      return;
    }
    const newMembers = [...new Map(friends.map((f) => [f.uid, f])).values()].filter(
      (f) => !group.memberUids.includes(f.uid)
    );
    for (const members of chunk(newMembers, MEMBERS_PER_WRITE)) {
      await this.writeNewMembers(group.id, members);
    }
  }

  private async writeNewMembers(groupId: string, members: Friend[]): Promise<void> {
    await updateDoc(doc(this.firestore, 'groups', groupId), {
      memberUids: arrayUnion(...members.map((f) => f.uid)),
      addedUids: members.map((f) => f.uid),
      ...Object.fromEntries(members.map((f) => [`members.${f.uid}`, memberFrom(f, f)])),
    });
  }

  async removeMember(group: Group, uid: string): Promise<void> {
    if (!group.id) {
      return;
    }
    await updateDoc(doc(this.firestore, 'groups', group.id), {
      memberUids: arrayRemove(uid),
      [`members.${uid}`]: deleteField(),
      addedUids: [],
    });
  }

  // Un miembro (no el dueño) sale del grupo.
  async leaveGroup(group: Group, uid: string): Promise<void> {
    if (!group.id) {
      return;
    }
    await updateDoc(doc(this.firestore, 'groups', group.id), {
      memberUids: arrayRemove(uid),
      [`members.${uid}`]: deleteField(),
    });
  }

  async deleteGroup(group: Group): Promise<void> {
    if (group.id) {
      await deleteDoc(doc(this.firestore, 'groups', group.id));
    }
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
