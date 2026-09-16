import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';

// Requiere sesión y email verificado (las cuentas de Google ya vienen verificadas). Si no hay
// sesión, se guarda a dónde iba para volver después de entrar (importante en las invitaciones,
// que se abren desde un enlace).
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/login'], { queryParams: { volver: state.url } });
      }
      return user.emailVerified ? true : router.parseUrl('/verify-email');
    })
  );
};

// Solo sesión iniciada, sin exigir verificación (pantalla de verificar email).
export const signedInGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map((user) => (user ? true : router.parseUrl('/login')))
  );
};
