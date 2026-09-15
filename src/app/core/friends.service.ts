import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, User as FirebaseUser, authState } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  deleteField,
  doc,
  docData,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { FapCounts } from '../shared/fap.model';
import { Friend, Social, SocialDoc, SocialEntry } from '../shared/friend.model';
import { User } from '../shared/user.model';
import { PerUserStreams } from './per-user-streams';

export const SEARCH_MIN_CHARS = 3;
const SEARCH_LIMIT = 10;

interface SearchResult {
  byEmail: User[];
  byName: User[];
  // true si la consulta devolvió menos del límite: contiene todas las coincidencias.
  emailComplete: boolean;
  nameComplete: boolean;
}

function toList(entries: Record<string, SocialEntry> | undefined): Friend[] {
  return Object.entries(entries ?? {}).map(([uid, entry]) => ({ ...entry, uid }));
}

// Amigos y solicitudes viven en un único documento social/{uid}: la pestaña Amigos, el
// contador de solicitudes y las exclusiones de la búsqueda cuestan 1 lectura en total.
@Injectable({
  providedIn: 'root',
})
export class FriendsService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private streams = new PerUserStreams(authState(inject(Auth)));
  private searchCache = new Map<string, SearchResult>();

  social$(uid: string): Observable<Social> {
    return this.streams.get('social', uid, () =>
      (this.inContext(() => docData(doc(this.firestore, 'social', uid))) as Observable<SocialDoc | undefined>).pipe(
        map((data) => {
          const friends = toList(data?.friends);
          const friendUids = new Set(friends.map((friend) => friend.uid));
          return {
            friends,
            // Una solicitud de alguien que ya es amigo (se enviaron mutuamente) no se muestra.
            requests: toList(data?.requests).filter((request) => !friendUids.has(request.uid)),
            sent: toList(data?.sent),
          };
        })
      )
    );
  }

  // Búsqueda por prefijo de email o nombre sobre users/. Para gastar pocas lecturas: exige un
  // mínimo de caracteres, limita resultados y, si una búsqueda anterior más corta ya trajo
  // todas las coincidencias, filtra en local sin volver a consultar.
  async searchUsers(term: string, excludeUids: ReadonlySet<string>): Promise<User[]> {
    const text = term.trim().toLowerCase();
    if (text.length < SEARCH_MIN_CHARS) {
      return [];
    }

    const result = this.searchCache.get(text) ?? this.fromCompletePrefix(text) ?? (await this.querySearch(text));
    this.searchCache.set(text, result);

    const users = new Map<string, User>();
    [...result.byEmail, ...result.byName]
      .filter((user) => !excludeUids.has(user.uid))
      .forEach((user) => users.set(user.uid, user));
    return [...users.values()];
  }

  private fromCompletePrefix(text: string): SearchResult | undefined {
    for (let length = text.length - 1; length >= SEARCH_MIN_CHARS; length--) {
      const cached = this.searchCache.get(text.slice(0, length));
      if (cached?.emailComplete && cached.nameComplete) {
        return {
          byEmail: cached.byEmail.filter((user) => user.email?.toLowerCase().startsWith(text)),
          byName: cached.byName.filter((user) => user.displayName?.toLowerCase().startsWith(text)),
          emailComplete: true,
          nameComplete: true,
        };
      }
    }
    return undefined;
  }

  private async querySearch(text: string): Promise<SearchResult> {
    const users = collection(this.firestore, 'users');
    const prefixQuery = async (field: string) => {
      const snapshot = await this.inContext(() =>
        getDocs(query(users, where(field, '>=', text), where(field, '<=', text + ''), limit(SEARCH_LIMIT)))
      );
      return snapshot.docs.map((d) => ({ ...(d.data() as User), uid: d.id }));
    };
    const [byEmail, byName] = await Promise.all([prefixQuery('emailLower'), prefixQuery('displayNameLower')]);
    return {
      byEmail,
      byName,
      emailComplete: byEmail.length < SEARCH_LIMIT,
      nameComplete: byName.length < SEARCH_LIMIT,
    };
  }

  async sendRequest(me: FirebaseUser, myCounts: FapCounts, target: User): Promise<void> {
    const batch = writeBatch(this.firestore);
    batch.set(
      this.socialRef(target.uid),
      { requests: { [me.uid]: { ...this.entryFor(me), ...myCounts } } },
      { merge: true }
    );
    batch.set(this.socialRef(me.uid), { sent: { [target.uid]: this.entryFor(target) } }, { merge: true });
    await batch.commit();
  }

  // Los totales del remitente vienen en la propia solicitud; se corrigen solos la próxima vez
  // que sume o borre (fap.service.ts#fanOut).
  async acceptRequest(me: FirebaseUser, myCounts: FapCounts, from: Friend): Promise<void> {
    const batch = writeBatch(this.firestore);
    batch.set(
      this.socialRef(me.uid),
      {
        requests: { [from.uid]: deleteField() },
        sent: { [from.uid]: deleteField() },
        friends: {
          [from.uid]: {
            ...this.entryFor(from),
            solitario: from.solitario ?? 0,
            compania: from.compania ?? 0,
            since: serverTimestamp(),
          },
        },
      },
      { merge: true }
    );
    batch.set(
      this.socialRef(from.uid),
      {
        sent: { [me.uid]: deleteField() },
        friends: { [me.uid]: { ...this.entryFor(me), ...myCounts, since: serverTimestamp() } },
      },
      { merge: true }
    );
    await batch.commit();
  }

  async rejectRequest(me: FirebaseUser, from: Friend): Promise<void> {
    const batch = writeBatch(this.firestore);
    batch.set(this.socialRef(me.uid), { requests: { [from.uid]: deleteField() } }, { merge: true });
    batch.set(this.socialRef(from.uid), { sent: { [me.uid]: deleteField() } }, { merge: true });
    await batch.commit();
  }

  private socialRef(uid: string) {
    return doc(this.firestore, 'social', uid);
  }

  private entryFor(user: { displayName: string | null; email: string | null; photoURL: string | null }): SocialEntry {
    return { displayName: user.displayName, email: user.email, photoURL: user.photoURL };
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
