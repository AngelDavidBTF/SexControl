export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // @usuario público (sin la arroba). null si aún no ha elegido uno.
  username?: string | null;
  emailVerified?: boolean;
}
