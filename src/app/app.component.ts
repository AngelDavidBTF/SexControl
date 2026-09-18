import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { NavigationEnd, Router } from '@angular/router';
import { combineLatest, filter, of, switchMap, take } from 'rxjs';
import { AnalyticsService } from './core/analytics.service';
import { AuthService } from './core/auth.service';
import { FapService } from './core/fap.service';
import { LockService } from './core/lock.service';
import { ProfileService } from './core/profile.service';
import { RemindersService } from './core/reminders.service';
import { SettingsService } from './core/settings.service';
import { AnalyticsConsentComponent } from './components/analytics-consent/analytics-consent.component';
import { LockScreenComponent } from './components/lock-screen/lock-screen.component';
import { STATS_VERSION } from './shared/fap.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IonicModule, LockScreenComponent, AnalyticsConsentComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // Aplica tema y modo discreto desde el arranque (efectos del servicio).
  readonly settings = inject(SettingsService);
  readonly lock = inject(LockService);
  readonly analytics = inject(AnalyticsService);

  constructor() {
    const fapService = inject(FapService);
    const reminders = inject(RemindersService);
    const auth = inject(AuthService);
    const profiles = inject(ProfileService);
    const destroyRef = inject(DestroyRef);
    const rebuilt = new Set<string>();

    // Vistas de pantalla. La ruta se limpia de identificadores antes de salir del dispositivo.
    inject(Router)
      .events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((event) => this.analytics.page(event.urlAfterRedirects));

    // Si fapStats no tiene el formato actual (usuarios con faps anteriores a los recuentos por
    // día/hora, o recién registrados), se reconstruye una única vez. El documento ya lo escucha
    // Sumar, así que comprobarlo no cuesta lecturas; después la versión queda guardada en él.
    auth.user$
      .pipe(
        switchMap((user) =>
          user
            ? fapService.stats$(user.uid).pipe(
                take(1),
                filter((s) => s.v !== STATS_VERSION),
                switchMap(() => of(user.uid))
              )
            : of(null)
        ),
        filter((uid): uid is string => uid !== null && !rebuilt.has(uid)),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((uid) => {
        rebuilt.add(uid);
        fapService.rebuildStats(uid).catch((error) => {
          rebuilt.delete(uid);
          console.error('No se pudieron reconstruir las estadísticas', error);
        });
      });

    // Perfil público y búsqueda por email de las cuentas creadas antes de separarlos de users/{uid}.
    auth.user$.pipe(takeUntilDestroyed(destroyRef)).subscribe((user) => {
      if (user) {
        profiles.ensurePublic(user).catch((error) => console.warn('No se pudo publicar el perfil público', error));
      }
    });

    // Recordatorio "llevas N días sin apuntar": se reprograma al cambiar datos o ajustes.
    combineLatest([
      auth.user$.pipe(switchMap((user) => (user ? fapService.stats$(user.uid) : of(null)))),
      toObservable(this.settings.reminders),
    ])
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(([stats]) => {
        if (stats) {
          void reminders.reschedule(stats.days);
        }
      });
  }
}
