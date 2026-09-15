import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, firstValueFrom, map } from 'rxjs';
import { PerUserStreams } from './per-user-streams';

export interface Profile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// Perfil propio desde users/{uid} (1 lectura por sesión). Es la fuente de verdad del nombre y la
// foto, porque la foto puede ser una data URL que Firebase Auth no admite.
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
      (runInInjectionContext(this.injector, () => docData(doc(this.firestore, 'users', uid))) as Observable<Partial<Profile> | undefined>).pipe(
        map((data) => {
          const user = this.auth.currentUser;
          return {
            uid,
            displayName: data?.displayName ?? user?.displayName ?? null,
            email: data?.email ?? user?.email ?? null,
            // null explícito en users/{uid} significa "sin foto".
            photoURL: data && 'photoURL' in data ? (data.photoURL ?? null) : (user?.photoURL ?? null),
          };
        })
      )
    );
  }

  current(uid: string): Promise<Profile> {
    return firstValueFrom(this.profile$(uid));
  }
}
