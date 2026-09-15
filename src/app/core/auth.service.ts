import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Auth,
  User as FirebaseUser,
  authState,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAdditionalUserInfo,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  UserCredential,
} from '@angular/fire/auth';
import { Firestore, doc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private ui = inject(UiService);

  readonly user$ = authState(this.auth);

  currentUid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  currentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  async login(email: string, password: string): Promise<FirebaseUser | null> {
    try {
      const { user } = await signInWithEmailAndPassword(this.auth, email, password);
      // No bloquea el login: si falla solo afecta a que el usuario aparezca en búsquedas.
      await this.ensureUserDoc(user).catch((error) => console.error('No se pudo actualizar users/{uid}', error));
      return user;
    } catch (error: unknown) {
      await this.ui.alertaInformativa(this.mapAuthError(error));
      return null;
    }
  }

  // Popup en web; si el navegador bloquea popups (o no los admite, como algunos WebView) se
  // usa redirección y el resultado se recoge al volver con completeGoogleRedirect().
  async loginGoogle(): Promise<FirebaseUser | null> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      return await this.afterGoogleLogin(await signInWithPopup(this.auth, provider));
    } catch (error: unknown) {
      const code = authErrorCode(error);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return null;
      }
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-environment') {
        await signInWithRedirect(this.auth, provider);
        return null;
      }
      console.error('Error al iniciar sesión con Google', error);
      await this.ui.alertaInformativa(this.mapAuthError(error));
      return null;
    }
  }

  async completeGoogleRedirect(): Promise<FirebaseUser | null> {
    try {
      // Se llama desde ngOnInit tras un await, fuera del contexto de inyección que exige AngularFire.
      const credential = await runInInjectionContext(this.injector, () => getRedirectResult(this.auth));
      return credential ? await this.afterGoogleLogin(credential) : null;
    } catch (error: unknown) {
      console.error('Error al volver del inicio de sesión con Google', error);
      await this.ui.alertaInformativa(this.mapAuthError(error));
      return null;
    }
  }

  private async afterGoogleLogin(credential: UserCredential): Promise<FirebaseUser> {
    const user = credential.user;
    await this.ensureUserDoc(user, getAdditionalUserInfo(credential)?.isNewUser === true).catch((error) =>
      console.error('No se pudo actualizar users/{uid}', error)
    );
    return user;
  }

  async register(email: string, password: string, displayName: string): Promise<FirebaseUser | null> {
    try {
      const { user } = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(user, { displayName });
      await sendEmailVerification(user);
      await this.ensureUserDoc(user, true);
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

  // Recarga el usuario desde Firebase (p. ej. tras verificar el email en otra pestaña).
  async reloadUser(): Promise<FirebaseUser | null> {
    const user = this.auth.currentUser;
    if (!user) {
      return null;
    }
    await user.reload();
    // Fuerza un token nuevo para que las reglas vean email_verified actualizado.
    await user.getIdToken(true);
    return this.auth.currentUser;
  }

  isPasswordUser(user: FirebaseUser): boolean {
    return user.providerData.some((provider) => provider.providerId === 'password');
  }

  // Firebase exige un inicio de sesión reciente para operaciones sensibles (borrar la cuenta).
  async reauthenticate(password: string | null): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('Sin sesión');
    }
    if (this.isPasswordUser(user)) {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? '', password ?? ''));
    } else {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    }
  }

  async updateDisplayName(displayName: string): Promise<void> {
    if (this.auth.currentUser) {
      await updateProfile(this.auth.currentUser, { displayName });
    }
  }

  async deleteCurrentUser(): Promise<void> {
    if (this.auth.currentUser) {
      await deleteUser(this.auth.currentUser);
    }
  }

  errorMessage(error: unknown): string {
    return this.mapAuthError(error);
  }

  isEmailVerified(user: { emailVerified: boolean }): boolean {
    return user.emailVerified === true;
  }

  // emailLower/displayNameLower permiten la búsqueda por prefijo de amigos (friends.service).
  // Se llama también en cada login para dar de alta a usuarios creados antes de existir users/{uid}.
  // Escritura ciega con merge (sin leer antes): createdAt solo se fija al crear la cuenta.
  private async ensureUserDoc(user: FirebaseUser, isNewUser = false): Promise<void> {
    const ref = doc(this.firestore, `users/${user.uid}`);
    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        emailLower: user.email?.toLowerCase() ?? null,
        displayNameLower: user.displayName?.toLowerCase() ?? null,
        ...(isNewUser ? { createdAt: serverTimestamp() } : {}),
      },
      { merge: true }
    );
  }

  private mapAuthError(error: unknown): string {
    switch (authErrorCode(error)) {
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
      case 'auth/account-exists-with-different-credential':
        return 'Ya tienes una cuenta con ese email. Entra con tu email y contraseña';
      case 'auth/unauthorized-domain':
        return 'Este dominio no está autorizado para entrar con Google';
      case 'auth/operation-not-allowed':
        return 'El inicio de sesión con Google no está activado';
      case 'auth/network-request-failed':
        return 'No hay conexión. Comprueba tu red e inténtalo de nuevo';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Espera un poco e inténtalo de nuevo';
      case 'auth/requires-recent-login':
        return 'Por seguridad, vuelve a introducir tu contraseña';
      case 'auth/missing-password':
        return 'Introduce tu contraseña';
      default:
        return 'Ha ocurrido un error, inténtalo de nuevo';
    }
  }
}

function authErrorCode(error: unknown): string | undefined {
  return (error as { code?: string } | undefined)?.code;
}
