import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { filter, of, switchMap, take } from 'rxjs';
import { AuthService } from './core/auth.service';
import { FapService } from './core/fap.service';
import { STATS_VERSION } from './shared/fap.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {
    const fapService = inject(FapService);
    const rebuilt = new Set<string>();

    // Si fapStats no tiene el formato actual (usuarios con faps anteriores a los recuentos por
    // día/hora, o recién registrados), se reconstruye una única vez. El documento ya lo escucha
    // Sumar, así que comprobarlo no cuesta lecturas; después la versión queda guardada en él.
    inject(AuthService)
      .user$.pipe(
        switchMap((user) => (user ? fapService.stats$(user.uid).pipe(take(1), filter((s) => s.v !== STATS_VERSION), switchMap(() => of(user.uid))) : of(null))),
        filter((uid): uid is string => uid !== null && !rebuilt.has(uid)),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((uid) => {
        rebuilt.add(uid);
        fapService.rebuildStats(uid).catch((error) => {
          rebuilt.delete(uid);
          console.error('No se pudieron reconstruir las estadísticas', error);
        });
      });
  }
}
