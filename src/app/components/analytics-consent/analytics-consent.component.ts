import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AnalyticsService } from '../../core/analytics.service';

// Consentimiento de medición. Sale una vez, al primer arranque, y hasta que se responda no se
// carga el SDK de Analytics ni se deja una sola cookie: el "no" es el estado de partida.
@Component({
  selector: 'app-analytics-consent',
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="velo" (click)="rechazar()"></div>
    <section class="hoja" role="dialog" aria-modal="true" aria-labelledby="medicion-titulo">
      <h2 id="medicion-titulo" class="f-title">Ayúdanos a mejorar <span translate="no">Follendario</span> 😏</h2>
      <p class="f-lead">
        Podemos recopilar información anónima sobre cómo utilizas la app para saber qué funciones
        funcionan mejor, detectar errores y mejorar <span translate="no">Follendario</span>.
      </p>
      <p class="f-lead destacado">No recopilamos el contenido de tus registros ni información personal.</p>

      <div class="botones">
        <ion-button expand="block" class="f-key pink aceptar-medicion" (click)="aceptar()">Aceptar</ion-button>
        <ion-button expand="block" class="f-btn rechazar-medicion" (click)="rechazar()">No, gracias</ion-button>
      </div>

      <p class="f-muted pie">Puedes cambiar tu decisión en cualquier momento desde Ajustes → Privacidad.</p>
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 99998;
      display: block;
    }
    .velo {
      position: absolute;
      inset: 0;
      background: var(--f-overlay);
    }
    .hoja {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--f-surface);
      border-top: 1px solid var(--f-line);
      border-radius: var(--f-radius) var(--f-radius) 0 0;
      padding: 22px 20px calc(20px + env(safe-area-inset-bottom));
      max-width: 520px;
      margin: 0 auto;
      animation: f-subir 240ms var(--f-ease-out) both;
    }
    .hoja .f-title {
      font-size: 22px;
    }
    .f-lead {
      margin-top: 10px;
      line-height: 1.5;
    }
    .destacado {
      color: var(--f-text);
      font-weight: 600;
    }
    .botones {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }
    .pie {
      font-size: 12px;
      text-align: center;
      margin: 14px 0 0;
    }
    @keyframes f-subir {
      from {
        transform: translateY(100%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .hoja {
        animation: none;
      }
    }
  `,
})
export class AnalyticsConsentComponent {
  private analytics = inject(AnalyticsService);

  aceptar(): void {
    this.analytics.grant();
  }

  rechazar(): void {
    this.analytics.deny();
  }
}
