import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User as FirebaseUser,
  authState,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from '@angular/fire/auth';
import { Firestore, doc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private ui = inject(UiService);

  readonly user$ = authState(this.auth);

  currentUid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async login(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const { user } = await signInWithEmailAndPassword(this.auth, email, password);
      return user;
    } catch (error: unknown) {
      await this.ui.alertaInformativa(this.mapAuthError(error));
      return null;
    }
  }

  async loginGoogle(): Promise<FirebaseUser | null> {
    try {
      const { user } = await signInWithPopup(this.auth, new GoogleAuthProvider());
      await this.ensureUserDoc(user);
      return user;
    } catch (error: unknown) {
      await this.ui.alertaInformativa(this.mapAuthError(error));
      return null;
    }
  }

  async register(email: string, password: string, displayName: string): Promise<FirebaseUser | null> {
    try {
      const { user } = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(user, { displayName });
      await sendEmailVerification(user);
      await this.ensureUserDoc(user);
      return user;
    } catch (error: unknown) {
      await this.ui.alertaInformativa(this.mapAuthError(error));
      return null;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: unknown) {
      await this.ui.alertaInformativa(this.mapAuthError(error));
    }
  }

  async sendVerificationEmail(): Promise<void> {
    if (this.auth.currentUser) {
      await sendEmailVerification(this.auth.currentUser);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  isEmailVerified(user: { emailVerified: boolean }): boolean {
    return user.emailVerified === true;
  }

  private async ensureUserDoc(user: FirebaseUser): Promise<void> {
    const ref = doc(this.firestore, `users/${user.uid}`);
    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  private mapAuthError(error: unknown): string {
    const code = (error as { code?: string } | undefined)?.code;
    switch (code) {
      case 'auth/invalid-email':
        return 'El email tiene un formato incorrecto';
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'El email o la contraseña no son correctos';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con ese email';
      case 'auth/weak-password':
        return 'La contraseña es demasiado débil';
      default:
        return 'Ha ocurrido un error, inténtalo de nuevo';
    }
  }
}
