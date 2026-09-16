import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';

import {
  Firestore,
  collection,
  deleteField,
  doc,
  docData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { pokeLabels, sortPokes } from '../shared/challenges';
import { emailHash, looksLikeEmail, normalizeEmail } from '../shared/email-hash';
import { normalizeName, normalizeUsername } from '../shared/username';
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

// Mínimo de letras para empezar a sugerir, y sugerencias por consulta (las reglas no dejan más de 10).
export const SEARCH_MIN_CHARS = 2;
const SUGGESTION_LIMIT = 10;

type DirectoryField = 'handle' | 'nameLower';

// Una persona del buscador (usernames/{handle}).
interface DirectoryUser extends User {
  nameLower: string | null;
}

interface PrefixResult {
  users: DirectoryUser[];
  // La consulta trajo menos del límite: están todas, y los prefijos más largos se filtran en local.
  complete: boolean;
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
  // Email normalizado → resultado, para no repetir lecturas al corregir lo escrito.
  private searchCache = new Map<string, User | null>();
  // 'campo:prefijo' → sugerencias.
  private prefixCache = new Map<string, PrefixResult>();

  social$(uid: string): Observable<Social> {
    return this.streams.get('social', uid, () =>
      (this.inContext(() => docData(doc(this.firestore, 'social', uid))) as Observable<SocialDoc | undefined>).pipe(
        map((data): Social => {
          const friends = toList(data?.friends);
          const byUid = new Map(friends.map((friend) => [friend.uid, friend]));
          const blocked = data?.blocked ?? {};
          return {
            friends,
            // No se muestran las solicitudes de quien ya es amigo (se las enviasteis a la vez) ni
            // de quien está bloqueado.
            requests: toList(data?.requests).filter((request) => !byUid.has(request.uid) && !(request.uid in blocked)),
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
            blocked: Object.entries(blocked)
              .map(([uid, entry]) => ({ ...entry, uid }))
              .sort((a, b) => (b.at?.toMillis() ?? 0) - (a.at?.toMillis() ?? 0)),
          };
        })
      )
    );
  }

  // Busca a alguien por su email EXACTO: emailIndex/{sha256} da el uid y profiles/{uid} el nombre
  // y la foto (2 lecturas). Antes se buscaba por prefijo de nombre o email sobre users/, lo que
  // obligaba a dejar listar a todo el mundo con su email. Devuelve null si nadie usa ese email, si
  // esa persona no quiere aparecer en búsquedas o si está excluida (yo, amigos, solicitudes).
  async findByEmail(email: string, excludeUids: ReadonlySet<string>): Promise<User | null> {
    const key = normalizeEmail(email);
    if (!this.searchCache.has(key)) {
      this.searchCache.set(key, await this.lookupEmail(key));
    }
    const user = this.searchCache.get(key) ?? null;
    return user && !excludeUids.has(user.uid) ? user : null;
  }

  // Sugerencias mientras se escribe: por el principio del @usuario y del nombre (sin tildes), solo
  // entre quien aparece en búsquedas. Un email completo se busca exacto. Cada consulta cuesta lo
  // que devuelve (máx. 10 lecturas); si una más corta ya las trajo todas, se filtra en local.
  async searchPeople(text: string, excludeUids: ReadonlySet<string>): Promise<User[]> {
    const term = text.trim();
    if (looksLikeEmail(term)) {
      const user = await this.findByEmail(term, excludeUids);
      return user ? [user] : [];
    }
    const onlyHandle = term.startsWith('@');
    const handle = normalizeUsername(term);
    const name = onlyHandle ? null : normalizeName(term);
    const searchHandle = handle.length >= SEARCH_MIN_CHARS && /^[a-z0-9_]+$/.test(handle);
    const searchName = !!name && name.length >= SEARCH_MIN_CHARS;

    const [byHandle, byName] = await Promise.all([
      searchHandle ? this.prefixSearch('handle', handle) : Promise.resolve([]),
      searchName ? this.prefixSearch('nameLower', name!) : Promise.resolve([]),
    ]);
    // Primero quien tiene justo ese @usuario, luego el resto por @usuario y después por nombre.
    const ordered = [...byHandle.filter((user) => user.username === handle), ...byHandle, ...byName];
    const unique = new Map<string, User>();
    for (const { nameLower: _, ...user } of ordered) {
      if (!excludeUids.has(user.uid) && !unique.has(user.uid)) {
        unique.set(user.uid, user);
      }
    }
    return [...unique.values()];
  }

  private async prefixSearch(field: DirectoryField, prefix: string): Promise<DirectoryUser[]> {
    const key = `${field}:${prefix}`;
    let result = this.prefixCache.get(key) ?? this.fromShorterPrefix(field, prefix);
    if (!result) {
      const snapshot = await this.inContext(() =>
        getDocs(
          query(
            collection(this.firestore, 'usernames'),
            where('visible', '==', true),
            where(field, '>=', prefix),
            where(field, '<=', prefix + '\uf8ff'),
            orderBy(field),
            limit(SUGGESTION_LIMIT)
          )
        )
      );
      const users = snapshot.docs.map((d): DirectoryUser => {
        const data = d.data() as { uid: string; displayName?: string | null; nameLower?: string | null; photoURL?: string | null };
        return { uid: data.uid, email: null, username: d.id, displayName: data.displayName ?? null, nameLower: data.nameLower ?? null, photoURL: data.photoURL ?? null };
      });
      result = { users, complete: users.length < SUGGESTION_LIMIT };
    }
    this.prefixCache.set(key, result);
    return result.users;
  }

  private fromShorterPrefix(field: DirectoryField, prefix: string): PrefixResult | undefined {
    for (let length = prefix.length - 1; length >= SEARCH_MIN_CHARS; length--) {
      const cached = this.prefixCache.get(`${field}:${prefix.slice(0, length)}`);
      if (cached?.complete) {
        const value = (user: DirectoryUser) => (field === 'handle' ? user.username : user.nameLower) ?? '';
        return { users: cached.users.filter((user) => value(user).startsWith(prefix)), complete: true };
      }
    }
    return undefined;
  }

  // emailIndex/{sha256} → uid → perfil público.
  private async lookupEmail(email: string): Promise<User | null> {
    const hash = await emailHash(email);
    const index = await this.inContext(() => getDoc(doc(this.firestore, 'emailIndex', hash)));
    const uid = index.exists() ? (index.data() as { uid?: string }).uid : undefined;
    return uid ? ((await this.publicProfile(uid)) ?? { uid, email: null, displayName: null, photoURL: null, username: null }) : null;
  }

  // Perfil público de una persona por su uid (enlace de invitación, búsqueda). null si no lo tiene:
  // cuentas que no han abierto la app desde que existe profiles/.
  async publicProfile(uid: string): Promise<User | null> {
    const snapshot = await this.inContext(() => getDoc(doc(this.firestore, 'profiles', uid)));
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data() as { displayName?: string | null; photoURL?: string | null; username?: string | null };
    return { uid, email: null, displayName: data.displayName ?? null, photoURL: data.photoURL ?? null, username: data.username ?? null };
  }

  // Bloquear: desaparece de mis amigos y solicitudes, y las reglas le impiden volver a pedirme
  // amistad. En su documento solo se quita lo que las reglas me dejan quitar según la relación
  // que tuviéramos; si falla, mi lado ya basta para que no pueda molestar.
  async blockUser(me: string, target: { uid: string; displayName: string | null }, social: Social): Promise<void> {
    const uid = target.uid;
    const wasFriend = social.friends.some((friend) => friend.uid === uid);
    const theyAsked = social.requests.some((request) => request.uid === uid);
    const iAsked = social.sent.some((sent) => sent.uid === uid);

    await setDoc(
      this.socialRef(me),
      {
        blocked: { [uid]: { displayName: target.displayName ?? null, at: serverTimestamp() } },
        friends: { [uid]: deleteField() },
        requests: { [uid]: deleteField() },
        sent: { [uid]: deleteField() },
        reactions: { [uid]: deleteField() },
        pokes: { [uid]: deleteField() },
        privacy: { [uid]: deleteField() },
        challenges: { [uid]: deleteField() },
        record: { [uid]: deleteField() },
      },
      { merge: true }
    );

    const theirs: Record<string, unknown>[] = [];
    if (wasFriend) {
      theirs.push({ friends: { [me]: deleteField() }, reactions: { [me]: deleteField() }, challenges: { [me]: deleteField() }, pokes: { [me]: deleteField() } });
    }
    if (theyAsked) {
      theirs.push({ sent: { [me]: deleteField() } });
    }
    if (iAsked) {
      theirs.push({ requests: { [me]: deleteField() } });
    }
    // Uno a uno: cada escritura encaja en una regla distinta.
    await Promise.allSettled(theirs.map((data) => setDoc(this.socialRef(uid), data, { merge: true })));
  }

  async unblockUser(me: string, uid: string): Promise<void> {
    await setDoc(this.socialRef(me), { blocked: { [uid]: deleteField() } }, { merge: true });
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

  // Nunca se copia el email: la otra persona solo ve el nombre y la foto.
  private entryFor(user: { displayName: string | null; photoURL: string | null }): SocialEntry {
    return { displayName: user.displayName, photoURL: user.photoURL };
  }

  // Las funciones de AngularFire deben ejecutarse dentro de un contexto de inyección;
  // estos métodos se llaman desde suscripciones y callbacks, fuera de él.
  private inContext<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
