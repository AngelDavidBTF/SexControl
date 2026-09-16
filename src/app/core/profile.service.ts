import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, User as FirebaseUser, authState } from '@angular/fire/auth';
import { Firestore, deleteDoc, doc, docData, getDoc, setDoc, writeBatch } from '@angular/fire/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';
import { emailHash } from '../shared/email-hash';
import { normalizeName } from '../shared/username';
import { PerUserStreams } from './per-user-streams';

export interface Profile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  // Si otros pueden encontrarme escribiendo mi email exacto (por defecto, sí).
  searchable: boolean;
  // @usuario (sin la arroba); null hasta que elige uno.
  username: string | null;
}

export type UsernameAvailability = 'libre' | 'tuyo' | 'cogido';

// Sube cuando cambie lo que se publica en profiles/ o emailIndex/, para que cada dispositivo lo
// vuelva a publicar una vez.
const PUBLIC_PROFILE_VERSION = 1;

// Perfil propio desde users/{uid} (1 lectura por sesión). Es la fuente de verdad del nombre y la
// foto, porque la foto puede ser una data URL que Firebase Auth no admite.
//
// users/{uid} solo lo lee su dueño. Lo que ven los demás vive aparte:
//  - profiles/{uid}: nombre, foto y @usuario, sin email (enlace de invitación, búsqueda).
//  - usernames/{usuario}: el buscador. Uid, nombre y foto, para sugerir mientras se escribe;
//    `visible` es el ajuste "Aparecer en búsquedas". Uno por cuenta.
//  - emailIndex/{sha256(email)}: el uid, para buscar por email exacto. Se borra si no quiero que
//    me encuentren.
@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private auth = inject(Auth);
  private streams = new PerUserStreams(authState(inject(Auth)));

  profile$(uid: string): Observable<Profile> {
    return this.streams.get('profile', uid, () =>
      (runInInjectionContext(this.injector, () => docData(doc(this.firestore, 'users', uid))) as Observable<
        (Partial<Profile> & { searchable?: boolean }) | undefined
      >).pipe(
        map((data) => {
          const user = this.auth.currentUser;
          return {
            uid,
            displayName: data?.displayName ?? user?.displayName ?? null,
            email: user?.email ?? null,
            // null explícito en users/{uid} significa "sin foto".
            photoURL: data && 'photoURL' in data ? (data.photoURL ?? null) : (user?.photoURL ?? null),
            searchable: data?.searchable !== false,
            username: (data as { username?: string } | undefined)?.username ?? null,
          };
        })
      )
    );
  }

  current(uid: string): Promise<Profile> {
    return firstValueFrom(this.profile$(uid));
  }

  // Nombre y foto visibles para los demás (el @usuario se conserva: va aparte).
  async publishPublic(uid: string, displayName: string | null, photoURL: string | null): Promise<void> {
    await setDoc(doc(this.firestore, 'profiles', uid), { displayName: displayName?.slice(0, 40) ?? null, photoURL }, { merge: true });
  }

  // 1 lectura. `handle` ya normalizado y válido. Un @usuario oculto de otra persona no se puede
  // leer (las reglas lo niegan), así que "sin permiso" también significa que está cogido.
  async usernameAvailability(uid: string, handle: string): Promise<UsernameAvailability> {
    try {
      const snapshot = await runInInjectionContext(this.injector, () => getDoc(doc(this.firestore, 'usernames', handle)));
      if (!snapshot.exists()) {
        return 'libre';
      }
      return (snapshot.data() as { uid?: string }).uid === uid ? 'tuyo' : 'cogido';
    } catch (error) {
      if ((error as { code?: string }).code === 'permission-denied') {
        return 'cogido';
      }
      throw error;
    }
  }

  // Elige o cambia el @usuario en una sola escritura: reserva el nuevo (con nombre y foto para el
  // buscador), libera el anterior y lo apunta en la cuenta y en el perfil público. Las reglas
  // exigen que vaya todo junto; si otra persona lo coge justo antes, lo rechazan.
  async setUsername(uid: string, handle: string, previous: string | null): Promise<void> {
    if (handle === previous) {
      return;
    }
    const profile = await this.current(uid);
    const batch = writeBatch(this.firestore);
    batch.set(doc(this.firestore, 'usernames', handle), directoryEntry(uid, handle, profile));
    if (previous) {
      batch.delete(doc(this.firestore, 'usernames', previous));
    }
    batch.set(doc(this.firestore, 'users', uid), { username: handle }, { merge: true });
    batch.set(doc(this.firestore, 'profiles', uid), { username: handle }, { merge: true });
    await batch.commit();
  }

  // Pone al día mi entrada del buscador tras cambiar nombre, foto o visibilidad (1 escritura, y
  // solo si tengo @usuario). Los cambios que se pasan mandan sobre lo leído, que puede llegar
  // un instante tarde.
  async refreshDirectory(uid: string, changes: Partial<Pick<Profile, 'displayName' | 'photoURL' | 'searchable'>> = {}): Promise<void> {
    const profile = { ...(await this.current(uid)), ...changes };
    if (profile.username) {
      await setDoc(doc(this.firestore, 'usernames', profile.username), directoryEntry(uid, profile.username, profile));
    }
  }

  // "Aparecer en búsquedas": por nombre y @usuario (buscador) y por email exacto (emailIndex).
  async setSearchable(user: FirebaseUser, searchable: boolean): Promise<void> {
    await setDoc(doc(this.firestore, 'users', user.uid), { searchable }, { merge: true });
    await this.refreshDirectory(user.uid, { searchable });
    if (user.email) {
      const ref = doc(this.firestore, 'emailIndex', await emailHash(user.email));
      await (searchable ? setDoc(ref, { uid: user.uid }) : deleteDoc(ref));
    }
  }

  // Publica el perfil público y la entrada de búsqueda: al arrancar la app (cuentas que ya
  // existían antes de separarlos de users/{uid}) y al verificar el email (cuentas nuevas). Una vez
  // por cuenta y dispositivo (2 escrituras): no merece la pena gastar una lectura en comprobar si
  // ya estaban. Sin email verificado solo se publica el perfil y se reintenta en el siguiente
  // arranque, porque las reglas exigen la verificación para la búsqueda.
  async ensurePublic(user: FirebaseUser): Promise<void> {
    const key = `sexcontrol.publicProfile.v${PUBLIC_PROFILE_VERSION}.${user.uid}`;
    try {
      if (localStorage.getItem(key)) {
        return;
      }
    } catch {
      // Sin almacenamiento local se publica en cada arranque; son dos escrituras idempotentes.
    }
    const profile = await this.current(user.uid);
    await this.publishPublic(user.uid, profile.displayName, profile.photoURL);
    await this.refreshDirectory(user.uid);
    if (!user.emailVerified) {
      return;
    }
    if (user.email) {
      const ref = doc(this.firestore, 'emailIndex', await emailHash(user.email));
      await (profile.searchable ? setDoc(ref, { uid: user.uid }) : deleteDoc(ref));
    }
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Ver arriba.
    }
  }

  // Borrado de cuenta.
  async deletePublic(user: FirebaseUser): Promise<void> {
    const { username } = await this.current(user.uid);
    await Promise.allSettled([
      deleteDoc(doc(this.firestore, 'profiles', user.uid)),
      username ? deleteDoc(doc(this.firestore, 'usernames', username)) : Promise.resolve(),
      user.email ? emailHash(user.email).then((hash) => deleteDoc(doc(this.firestore, 'emailIndex', hash))) : Promise.resolve(),
    ]);
  }
}

// usernames/{handle}: lo que el buscador necesita para sugerir sin leer nada más.
function directoryEntry(uid: string, handle: string, profile: Pick<Profile, 'displayName' | 'photoURL' | 'searchable'>) {
  return {
    uid,
    handle,
    displayName: profile.displayName?.slice(0, 40) ?? null,
    nameLower: normalizeName(profile.displayName),
    photoURL: profile.photoURL,
    visible: profile.searchable,
  };
}
