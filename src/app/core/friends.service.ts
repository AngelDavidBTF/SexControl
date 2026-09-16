import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';

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
  setDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { pokeLabels, sortPokes } from '../shared/challenges';
import { FapCounts } from '../shared/fap.model';
import {
  Challenge,
  ChallengeStatus,
  DuelRecord,
  Friend,
  FriendChallenge,
  GroupPrivacy,
  MAX_POKES,
  PrivacyLevel,
  ReceivedPoke,
  Social,
  SocialDoc,
  SocialEntry,
} from '../shared/friend.model';
import { User } from '../shared/user.model';
import { PerUserStreams } from './per-user-streams';
import type { Profile } from './profile.service';

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
        map((data): Social => {
          const friends = toList(data?.friends);
          const byUid = new Map(friends.map((friend) => [friend.uid, friend]));
          return {
            friends,
            // Una solicitud de alguien que ya es amigo (se enviaron mutuamente) no se muestra.
            requests: toList(data?.requests).filter((request) => !byUid.has(request.uid)),
            sent: toList(data?.sent),
            reactions: Object.entries(data?.reactions ?? {})
              .filter(([uid]) => byUid.has(uid))
              .map(([uid, reaction]) => ({
                ...reaction,
                uid,
                displayName: byUid.get(uid)?.displayName ?? null,
                photoURL: byUid.get(uid)?.photoURL ?? null,
              }))
              .sort((a, b) => (b.at?.toMillis() ?? 0) - (a.at?.toMillis() ?? 0)),
            // Pullas: solo las de quien sigue siendo amigo, de más reciente a más antigua.
            pokes: sortPokes(
              Object.entries(data?.pokes ?? {})
                .filter(([uid, poke]) => byUid.has(uid) && poke.from === uid)
                .map(([id, poke]): ReceivedPoke => ({
                  ...poke,
                  ...pokeLabels(poke),
                  id,
                  displayName: byUid.get(poke.from)?.displayName ?? null,
                  photoURL: byUid.get(poke.from)?.photoURL ?? null,
                })),
              MAX_POKES
            ),
            challenges: Object.entries(data?.challenges ?? {})
              .filter(([uid]) => byUid.has(uid))
              .map(([uid, challenge]): FriendChallenge => ({ ...challenge, uid, friend: byUid.get(uid) ?? null })),
            record: data?.record ?? {},
            wins: data?.wins ?? 0,
            privacy: data?.privacy ?? {},
            groupPrivacy: data?.groupPrivacy ?? {},
            paused: data?.paused === true,
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
        getDocs(query(users, where(field, '>=', text), where(field, '<=', text + '\uf8ff'), limit(SEARCH_LIMIT)))
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

  async sendRequest(me: Profile, myCounts: FapCounts, target: User): Promise<void> {
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
  async acceptRequest(me: Profile, myCounts: FapCounts, from: Friend): Promise<void> {
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

  async rejectRequest(me: { uid: string }, from: Friend): Promise<void> {
    const batch = writeBatch(this.firestore);
    batch.set(this.socialRef(me.uid), { requests: { [from.uid]: deleteField() } }, { merge: true });
    batch.set(this.socialRef(from.uid), { sent: { [me.uid]: deleteField() } }, { merge: true });
    await batch.commit();
  }

  // Rompe la amistad en ambos lados (y retira reacciones y ajustes de privacidad de esa persona).
  async removeFriend(me: string, friendUid: string): Promise<void> {
    const batch = writeBatch(this.firestore);
    batch.set(
      this.socialRef(me),
      {
        friends: { [friendUid]: deleteField() },
        reactions: { [friendUid]: deleteField() },
        privacy: { [friendUid]: deleteField() },
        challenges: { [friendUid]: deleteField() },
        record: { [friendUid]: deleteField() },
      },
      { merge: true }
    );
    batch.set(
      this.socialRef(friendUid),
      { friends: { [me]: deleteField() }, reactions: { [me]: deleteField() }, challenges: { [me]: deleteField() }, pokes: { [me]: deleteField() } },
      { merge: true }
    );
    await batch.commit();
  }

  async setPrivacy(me: string, friendUid: string, level: PrivacyLevel): Promise<void> {
    await setDoc(
      this.socialRef(me),
      { privacy: { [friendUid]: level === 'todo' ? deleteField() : level } },
      { merge: true }
    );
  }

  // Qué comparto en un grupo concreto. "todo" es lo de siempre, así que se borra la excepción.
  async setGroupPrivacy(me: string, groupId: string, level: GroupPrivacy): Promise<void> {
    await setDoc(
      this.socialRef(me),
      { groupPrivacy: { [groupId]: level === 'todo' ? deleteField() : level } },
      { merge: true }
    );
  }

  async setPaused(me: string, paused: boolean): Promise<void> {
    await setDoc(this.socialRef(me), { paused }, { merge: true });
  }

  async sendReaction(me: string, friendUid: string, emoji: string): Promise<void> {
    await setDoc(
      this.socialRef(friendUid),
      { reactions: { [me]: { emoji, at: serverTimestamp() } } },
      { merge: true }
    );
  }

  async clearReactions(me: string): Promise<void> {
    await setDoc(this.socialRef(me), { reactions: deleteField(), pokes: deleteField() }, { merge: true });
  }

  // ---------------------------------------------------------------- pullas y duelos

  // Una pulla (mensaje predefinido) o una reacción suelta. Se guarda la última de cada amigo, con
  // su uid como clave: es lo único que las reglas pueden comprobar sin dejar que nadie llene el
  // documento con claves inventadas.
  async sendPoke(me: string, friendUid: string, poke: { msg?: string; emoji?: string }): Promise<void> {
    await setDoc(
      this.socialRef(friendUid),
      { pokes: { [me]: { from: me, msg: poke.msg ?? null, emoji: poke.emoji ?? null, at: serverTimestamp() } } },
      { merge: true }
    );
  }

  // Propone un duelo: mi copia y la suya, cada una con la clave del otro.
  async sendChallenge(me: string, friendUid: string, challenge: Omit<Challenge, 'at'>): Promise<void> {
    const data = { ...challenge, at: serverTimestamp() };
    const batch = writeBatch(this.firestore);
    batch.set(this.socialRef(me), { challenges: { [friendUid]: data } }, { merge: true });
    batch.set(this.socialRef(friendUid), { challenges: { [me]: data } }, { merge: true });
    await batch.commit();
  }

  // Acepta, rechaza o cierra un duelo en los dos lados. Al cerrarlo se apunta el resultado en mi
  // marcador con ese amigo (y en mis duelos ganados, que sí se publican).
  async updateChallenge(
    me: string,
    friendUid: string,
    challenge: Challenge,
    status: ChallengeStatus,
    outcome?: { winnerUid: string | null; record: DuelRecord; wins: number }
  ): Promise<void> {
    const data = { ...challenge, status, winnerUid: outcome ? outcome.winnerUid : (challenge.winnerUid ?? null) };
    const batch = writeBatch(this.firestore);
    batch.set(
      this.socialRef(me),
      {
        challenges: { [friendUid]: data },
        ...(outcome ? { record: { [friendUid]: outcome.record }, wins: outcome.wins } : {}),
      },
      { merge: true }
    );
    batch.set(this.socialRef(friendUid), { challenges: { [me]: data } }, { merge: true });
    await batch.commit();
  }

  // Borrado de cuenta: me quito de las listas de mis amigos y retiro/rechazo solicitudes pendientes.
  async detachEverywhere(me: string, social: Social): Promise<void> {
    const writes: [string, Record<string, unknown>][] = [
      ...social.friends.map((f): [string, Record<string, unknown>] => [
        f.uid,
        { friends: { [me]: deleteField() }, reactions: { [me]: deleteField() }, challenges: { [me]: deleteField() } },
      ]),
      ...social.sent.map((s): [string, Record<string, unknown>] => [s.uid, { requests: { [me]: deleteField() } }]),
      ...social.requests.map((r): [string, Record<string, unknown>] => [r.uid, { sent: { [me]: deleteField() } }]),
    ];
    // Uno a uno: si alguien ya no existe o su documento cambió, no bloquea al resto.
    await Promise.allSettled(writes.map(([uid, data]) => setDoc(this.socialRef(uid), data, { merge: true })));
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
