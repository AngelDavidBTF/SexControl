import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { AuthService } from './core/auth.service';
import { FapService } from './core/fap.service';

// Versión del recálculo de totales: subirla fuerza un nuevo recálculo en todos los dispositivos.
const RECONCILE_VERSION = '2';

function reconcileKey(uid: string): string {
  return `sexcontrol.statsReconciled.${uid}`;
}

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

    // Una vez por usuario y dispositivo se recalculan los totales de fapStats y se propagan a
    // amigos y grupos (alta de usuarios con faps anteriores). Después, sumar y borrar los
    // mantienen al día, así que abrir la app no gasta lecturas en esto.
    inject(AuthService)
      .user$.pipe(
        map((user) => user?.uid ?? null),
        distinctUntilChanged(),
        filter((uid): uid is string => uid !== null && readFlag(reconcileKey(uid)) !== RECONCILE_VERSION),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe((uid) => {
        fapService
          .reconcileStats(uid)
          .then(() => writeFlag(reconcileKey(uid), RECONCILE_VERSION))
          .catch((error) => console.error('No se pudieron recalcular los totales', error));
      });
  }
}

function readFlag(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFlag(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento local se recalculará en el próximo arranque; no es un error.
  }
}
