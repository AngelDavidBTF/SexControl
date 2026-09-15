import { Injectable, effect, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';

// Tras este tiempo en segundo plano se vuelve a pedir el PIN.
const RELOCK_AFTER_MS = 30_000;

// Bloqueo del modo discreto: la app arranca bloqueada si hay PIN y se vuelve a bloquear al
// volver de segundo plano pasado un rato.
@Injectable({
  providedIn: 'root',
})
export class LockService {
  private settings = inject(SettingsService);
  readonly locked = signal(this.settings.lockEnabled());
  private hiddenAt: number | null = null;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.hiddenAt = Date.now();
      } else if (this.hiddenAt !== null && Date.now() - this.hiddenAt > RELOCK_AFTER_MS && this.settings.lockEnabled()) {
        this.locked.set(true);
      }
    });
    // Si se desactiva el bloqueo desde ajustes, se desbloquea.
    effect(() => {
      if (!this.settings.lockEnabled()) {
        this.locked.set(false);
      }
    });
  }

  async unlock(pin: string): Promise<boolean> {
    const ok = await this.settings.checkPin(pin);
    if (ok) {
      this.locked.set(false);
    }
    return ok;
  }
}
