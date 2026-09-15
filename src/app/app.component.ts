import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { AuthService } from './core/auth.service';
import { FapService } from './core/fap.service';

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

    // Al iniciar sesión se recalculan los totales de fapStats (alta de usuarios con faps
    // anteriores y corrección de desfases). No bloquea la app si falla.
    inject(AuthService)
      .user$.pipe(
        map((user) => user?.uid ?? null),
        distinctUntilChanged(),
        filter((uid): uid is string => uid !== null),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((uid) => {
        fapService.reconcileStats(uid).catch((error) => console.error('No se pudieron recalcular los totales', error));
      });
  }
}
