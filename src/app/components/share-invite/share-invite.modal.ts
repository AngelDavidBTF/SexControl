import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { toDataURL } from 'qrcode';
import { UiService } from '../../core/ui.service';

// Enlace de invitación con su QR, para amigos o para un grupo. El QR se dibuja en el dispositivo:
// no se sube nada a ningún sitio.
@Component({
  selector: 'app-share-invite-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()" aria-label="Cerrar"><ion-icon slot="icon-only" name="close"></ion-icon></ion-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p class="f-muted">{{ subtitle }}</p>

      <div class="qr" *ngIf="qr; else generando">
        <img [src]="qr" alt="Código QR de la invitación" />
        <img class="qr-logo" src="assets/follendario/simbolo.png" alt="" width="48" height="46" />
      </div>
      <ng-template #generando>
        <div class="ion-text-center ion-margin"><ion-spinner name="circular"></ion-spinner></div>
      </ng-template>

      <div class="enlace">
        <code>{{ url }}</code>
      </div>

      <ion-button expand="block" class="f-key pink compartir-invitacion" (click)="share()">
        <ion-icon slot="start" name="share-social-outline"></ion-icon>
        Compartir enlace
      </ion-button>
      <ion-button expand="block" class="f-btn copiar-invitacion" (click)="copy()">
        <ion-icon slot="start" name="copy-outline"></ion-icon>
        Copiar enlace
      </ion-button>
      <ion-button *ngIf="canRenew" expand="block" fill="clear" class="f-ghost renovar-invitacion" (click)="renew()">
        Generar un enlace nuevo
      </ion-button>
      <p class="f-muted aviso">{{ warning }}</p>
    </ion-content>
  `,
  styles: [
    `
      .qr {
        position: relative;
        display: flex;
        justify-content: center;
        margin: 8px 0 16px;
      }
      .qr img:first-child {
        width: 220px;
        height: 220px;
        border-radius: 12px;
        background: #fff;
        padding: 8px;
      }
      .qr-logo {
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -23px 0 0 -24px;
        background: #fff;
        border-radius: 8px;
        padding: 3px;
      }
      .enlace {
        background: var(--f-surface-2);
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 16px;
        overflow-wrap: anywhere;
      }
      .enlace code {
        font-size: 0.8rem;
      }
      .aviso {
        font-size: 0.78rem;
        margin-top: 14px;
      }
    `,
  ],
})
export class ShareInviteModal implements OnInit {
  @Input({ required: true }) url!: string;
  @Input() title = 'Invitación';
  @Input() subtitle = 'Comparte este enlace o enseña el QR.';
  @Input() warning = '';
  @Input() canRenew = false;
  // La devuelve el llamante con el código nuevo, para no meter aquí lógica de datos.
  @Input() onRenew?: () => Promise<string>;

  private modalController = inject(ModalController);
  private ui = inject(UiService);

  qr: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.drawQr();
  }

  private async drawQr(): Promise<void> {
    try {
      this.qr = await toDataURL(this.url, { width: 440, margin: 1 });
    } catch (error) {
      console.error('No se pudo generar el QR', error);
      this.qr = null;
    }
  }

  async share(): Promise<void> {
    if (navigator.share) {
      await navigator.share({ title: this.title, url: this.url }).catch(() => undefined);
      return;
    }
    await this.copy();
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url);
      await this.ui.toast('Enlace copiado');
    } catch {
      await this.ui.toast('Copia el enlace a mano: tu navegador no deja copiarlo solo');
    }
  }

  async renew(): Promise<void> {
    if (!this.onRenew) {
      return;
    }
    const loading = await this.ui.loading('Generando enlace…');
    try {
      this.url = await this.onRenew();
      await this.drawQr();
      await loading.dismiss();
      await this.ui.toast('Enlace nuevo listo. El anterior ya no sirve');
    } catch (error) {
      await loading.dismiss();
      console.error('No se pudo renovar la invitación', error);
      await this.ui.toast('No se pudo generar el enlace');
    }
  }

  close(): void {
    this.modalController.dismiss();
  }
}
