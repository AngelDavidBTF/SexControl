import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LockService } from '../../core/lock.service';
import { SettingsService } from '../../core/settings.service';

const PIN_LENGTH = 4;

// Pantalla de bloqueo del modo discreto (teclado numérico con PIN de 4 cifras).
@Component({
  selector: 'app-lock-screen',
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bloqueo" role="dialog" aria-modal="true" aria-label="Introduce tu PIN">
      <ion-icon name="lock-closed-outline" class="icono" aria-hidden="true"></ion-icon>
      <h2 translate="no">{{ settings.discreet().neutralName ? 'Notas' : 'Follendario' }}</h2>
      <p class="f-lead" aria-live="polite">{{ error() ? 'Ese no es. Otra vez.' : 'Pon tu PIN' }}</p>

      <div class="puntos" [class.error]="error()" aria-hidden="true">
        <span *ngFor="let i of dots" [class.lleno]="i < pin().length"></span>
      </div>

      <div class="teclado">
        <button type="button" *ngFor="let key of keys" (click)="press(key)" [attr.aria-label]="key === 'borrar' ? 'Borrar' : key" [class.vacia]="key === ''" [disabled]="key === ''">
          <ion-icon *ngIf="key === 'borrar'; else numero" name="backspace-outline"></ion-icon>
          <ng-template #numero>{{ key }}</ng-template>
        </button>
      </div>

      <button type="button" class="olvidado" (click)="forgot()">¿has olvidado el PIN?</button>
    </div>
  `,
  styles: `
    .bloqueo {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: var(--f-bg);
      color: var(--f-text);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .icono {
      font-size: 48px;
      color: var(--f-muted);
    }
    h2 {
      margin: 8px 0 0;
      font-weight: 700;
    }
    .puntos {
      display: flex;
      gap: 16px;
      margin: 8px 0 32px;
    }
    .puntos span {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid var(--f-line);
    }
    .puntos span.lleno {
      background: var(--f-text);
      border-color: var(--f-text);
    }
    .puntos.error {
      animation: temblor 0.35s;
    }
    .puntos.error span {
      border-color: var(--f-down);
    }
    @keyframes temblor {
      25% { transform: translateX(-8px); }
      75% { transform: translateX(8px); }
    }
    .teclado {
      display: grid;
      grid-template-columns: repeat(3, 72px);
      gap: 16px;
    }
    .teclado button {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 0;
      font-size: 26px;
      background: var(--f-surface-2);
      color: var(--f-text);
      box-shadow: inset 0 -3px 0 rgba(16, 8, 26, 0.18);
    }
    .teclado button.vacia {
      visibility: hidden;
    }
    .olvidado {
      margin-top: 28px;
      background: none;
      border: 0;
      color: var(--f-muted);
      font-family: var(--f-mono);
      text-decoration: underline;
      text-underline-offset: 4px;
    }
  `,
})
export class LockScreenComponent {
  readonly settings = inject(SettingsService);
  private lock = inject(LockService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private alertController = inject(AlertController);

  readonly dots = Array.from({ length: PIN_LENGTH }, (_, i) => i);
  readonly keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'borrar'];
  readonly pin = signal('');
  readonly error = signal(false);

  async press(key: string): Promise<void> {
    this.error.set(false);
    if (key === 'borrar') {
      this.pin.update((pin) => pin.slice(0, -1));
      return;
    }
    const next = (this.pin() + key).slice(0, PIN_LENGTH);
    this.pin.set(next);
    if (next.length === PIN_LENGTH && !(await this.lock.unlock(next))) {
      this.error.set(true);
      this.pin.set('');
    }
  }

  // Sin PIN no hay forma de recuperarlo: se cierra sesión y se quita el bloqueo de este dispositivo.
  async forgot(): Promise<void> {
    const alert = await this.alertController.create({
      header: '¿Has olvidado el PIN?',
      message: 'Se cerrará la sesión y se quitará el PIN de este dispositivo. Tus datos no se pierden.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            this.settings.removePin();
            void this.auth.logout().then(() => this.router.navigate(['/login'], { replaceUrl: true }));
          },
        },
      ],
    });
    await alert.present();
  }
}
