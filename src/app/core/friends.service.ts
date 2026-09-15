import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { User as FirebaseUser } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Fap } from '../shared/fap.model';
import { FapCounts, Friend, FriendRequest } from '../shared/friend.model';
import { User } from '../shared/user.model';

const SEARCH_LIMIT = 20;

export function requestId(fromUid: string, toUid: string): string {
  return `${fromUid}_${toUid}`;
}

@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  friends$(uid: string): Observable<Friend[]> {
    const ref = collection(this.firestore, `users/${uid}/friends`);
    return this.inContext(() => collectionData(ref)) as Observable<Friend[]>;
  }

  incomingRequests$(uid: string): Observable<FriendRequest[]> {
    const q = query(collection(this.firestore, 'friendRequests'), where('toUid', '==', uid));
    return this.inContext(() => collectionData(q, { idField: 'id' })) as Observable<FriendRequest[]>;
  }

  outgoingRequests$(uid: string): Observable<FriendRequest[]> {
    const q = query(collection(this.firestore, 'friendRequests'), where('fromUid', '==', uid));
    return this.inContext(() => collectionData(q, { idField: 'id' })) as Observable<FriendRequest[]>;
  }

  fapCounts$(uid: string): Observable<FapCounts> {
    const q = query(collection(this.firestore, 'faps'), where('uid', '==', uid));
    return (this.inContext(() => collectionData(q)) as Observable<Fap[]>).pipe(
      map((faps) => ({
        solitario: faps.filter((fap) => fap.solitario).length,
        compania: faps.filter((fap) => !fap.solitario).length,
      }))
    );
  }

  // Búsqueda por prefijo de email o nombre (en minúsculas) sobre users/. Por privacidad
  // solo se consulta cuando hay texto, igual que en la versión anterior.
  async searchUsers(term: string, excludeUids: ReadonlySet<string>): Promise<User[]> {
    const text = term.trim().toLowerCase();
    if (!text) {
      return [];
    }

    const users = collection(this.firestore, 'users');
    const prefixQuery = (field: string) =>
      this.inContext(() =>
        getDocs(query(users, where(field, '>=', text), where(field, '<=', text + '\uf8ff'), limit(SEARCH_LIMIT)))
      );

    const snapshots = await Promise.all([prefixQuery('emailLower'), prefixQuery('displayNameLower')]);

    const results = new Map<string, User>();
    for (const snapshot of snapshots) {
      for (const d of snapshot.docs) {
        if (!excludeUids.has(d.id)) {
          results.set(d.id, { ...(d.data() as User), uid: d.id });
        }
      }
    }
    return [...results.values()];
  }

  async sendRequest(from: FirebaseUser, toUid: string): Promise<void> {
    const request: FriendRequest = {
      fromUid: from.uid,
      fromDisplayName: from.displayName,
      fromEmail: from.email,
      fromPhotoURL: from.photoURL,
      toUid,
    };
    await setDoc(doc(this.firestore, 'friendRequests', requestId(from.uid, toUid)), {
      ...request,
      createdAt: serverTimestamp(),
    });
  }

  async acceptRequest(request: FriendRequest, me: FirebaseUser): Promise<void> {
    const batch = writeBatch(this.firestore);

    batch.set(doc(this.firestore, `users/${me.uid}/friends/${request.fromUid}`), {
      uid: request.fromUid,
      displayName: request.fromDisplayName,
      email: request.fromEmail,
      photoURL: request.fromPhotoURL,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(this.firestore, `users/${request.fromUid}/friends/${me.uid}`), {
      uid: me.uid,
      displayName: me.displayName,
      email: me.email,
      photoURL: me.photoURL,
      createdAt: serverTimestamp(),
    });
    batch.delete(doc(this.firestore, 'friendRequests', requestId(request.fromUid, me.uid)));

    await batch.commit();

    // Si ambos se habían enviado solicitud mutuamente, la inversa ya no tiene sentido.
    await deleteDoc(doc(this.firestore, 'friendRequests', requestId(me.uid, request.fromUid))).catch(() => undefined);
  }

  async rejectRequest(request: FriendRequest): Promise<void> {
    await deleteDoc(doc(this.firestore, 'friendRequests', requestId(request.fromUid, request.toUid)));
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
