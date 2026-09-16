import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { DatoDirective } from '../../shared/dato.directive';
import { Challenge, DuelRecord, Friend, PRIVACY_LABELS, PrivacyLevel } from '../../shared/friend.model';
import { ChallengeScore, challengeLabel, challengeScore } from '../../shared/challenges';
import { ComparisonRow, MyEntry, comparison, lastActivityLabel } from '../../shared/social';

// Acciones que la ficha devuelve a la página de amigos.
export type FriendAction = 'react' | 'privacy' | 'remove' | 'block' | 'poke' | 'challenge' | 'accept' | 'reject';

// Ficha de un amigo: comparativa "tú vs él" en los periodos que comparte, racha, logros y
// última actividad. Todo sale de social/{uid}, que ya está cargado: no cuesta lecturas.
@Component({
  selector: 'app-friend-detail-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, DatoDirective],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()" aria-label="Cerrar"><ion-icon slot="icon-only" name="close"></ion-icon></ion-button>
        </ion-buttons>
        <ion-title>{{ name }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="perfil">
        <ion-avatar>
          <img [src]="friend.photoURL || 'assets/icon-user.svg'" alt="" />
        </ion-avatar>
        <h2>{{ name }}</h2>
        <p *ngIf="privacyNote" class="muted ve-de-ti">{{ privacyNote }}</p>
      </div>

      <div class="insignias">
        <div class="insignia" *ngIf="friend.streak != null">
          <span class="emoji" aria-hidden="true">🔥</span>
          <strong dato>{{ friend.streak }}</strong>
          <span class="muted">{{ friend.streak === 1 ? 'día de racha' : 'días de racha' }}</span>
        </div>
        <div class="insignia" *ngIf="friend.badges != null">
          <span class="emoji" aria-hidden="true">🏅</span>
          <strong>{{ friend.badges }}</strong>
          <span class="muted">{{ friend.badges === 1 ? 'logro' : 'logros' }}</span>
        </div>
        <div class="insignia" *ngIf="lastActivity">
          <span class="emoji" aria-hidden="true">🕒</span>
          <strong>{{ lastActivity }}</strong>
          <span class="muted">última vez</span>
        </div>
      </div>

      <ng-container *ngIf="rows.length > 0; else sinDatos">
        <h4>Tú vs {{ name }}</h4>
        <div class="comparativa">
          <div class="fila" *ngFor="let row of rows">
            <div class="etiqueta">
              <span>{{ row.label }}</span>
              <span class="resultado" [class.gano]="row.mine > row.theirs" [class.pierdo]="row.mine < row.theirs">{{ verdict(row) }}</span>
            </div>
            <div class="barras">
              <span class="valor mio" dato>{{ row.mine }}</span>
              <div class="barra">
                <div class="mia" [style.width.%]="width(row.mine, row)"></div>
                <div class="suya" [style.width.%]="width(row.theirs, row)"></div>
              </div>
              <span class="valor suyo" dato>{{ row.theirs }}</span>
            </div>
          </div>
        </div>
        <p class="leyenda">
          <span class="punto mia"></span> Tú
          <span class="punto suya"></span> {{ name }}
        </p>
      </ng-container>
      <ng-template #sinDatos>
        <p class="ion-text-center muted sin-datos">
          {{ friend.hidden ? name + ' no comparte sus números.' : name + ' solo comparte su total.' }}
        </p>
      </ng-template>

      <!-- Duelo en curso o marcador histórico. -->
      <div class="duelo" *ngIf="challenge as duelo">
        <div class="duelo-cabecera">
          <strong>⚔️ {{ label(duelo) }}</strong>
          <span class="muted">{{ estado(duelo) }}</span>
        </div>
        <div class="duelo-marcador" *ngIf="score as marcador">
          <span class="valor mio" dato>{{ marcador.mine }}</span>
          <span class="muted">–</span>
          <span class="valor suyo" dato>{{ marcador.theirs }}</span>
        </div>
        <p class="muted" *ngIf="!score">No se puede seguir: {{ name }} ha dejado de compartir su semana.</p>
        <div class="duelo-acciones" *ngIf="duelo.status === 'pendiente' && duelo.from !== me.uid">
          <ion-button size="small" color="secondary" (click)="act('accept')" class="aceptar-duelo">Aceptar</ion-button>
          <ion-button size="small" fill="outline" color="medium" (click)="act('reject')" class="rechazar-duelo">Rechazar</ion-button>
        </div>
      </div>
      <p class="marcador-historico muted" *ngIf="record && record.wins + record.losses > 0">
        Duelos: ganas {{ record.wins }} – {{ record.losses }} {{ name }}
      </p>

      <div class="acciones">
        <ion-button *ngIf="!challenge" expand="block" color="primary" (click)="act('challenge')" class="accion-duelo">
          <ion-icon slot="start" name="trophy"></ion-icon>
          Retar a un duelo
        </ion-button>
        <ion-button expand="block" color="secondary" (click)="act('poke')" class="accion-pulla">
          <ion-icon slot="start" name="hand-right"></ion-icon>
          Mandar una pulla
        </ion-button>
        <ion-button expand="block" fill="outline" color="secondary" (click)="act('react')" class="accion-reaccion">
          <ion-icon slot="start" name="happy-outline"></ion-icon>
          Mandar una reacción
        </ion-button>
        <ion-button expand="block" fill="outline" (click)="act('privacy')" class="accion-privacidad">
          <ion-icon slot="start" name="eye-outline"></ion-icon>
          Qué ve de ti: {{ privacyLabel }}
        </ion-button>
        <ion-button expand="block" fill="clear" color="danger" (click)="act('remove')" class="accion-eliminar">
          <ion-icon slot="start" name="person-remove-outline"></ion-icon>
          Eliminar amistad
        </ion-button>
        <ion-button expand="block" fill="clear" color="medium" (click)="act('block')" class="accion-bloquear">
          <ion-icon slot="start" name="ban-outline"></ion-icon>
          Bloquear
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .perfil {
        text-align: center;
      }
      .perfil ion-avatar {
        width: 84px;
        height: 84px;
        margin: 0 auto 8px;
      }
      .perfil h2 {
        margin: 0;
      }
      .muted {
        color: var(--ion-color-medium);
      }
      .insignias {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin: 16px 0 8px;
        flex-wrap: wrap;
      }
      .insignia {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 0.8rem;
        min-width: 72px;
      }
      .insignia .emoji {
        font-size: 1.4rem;
      }
      .insignia strong {
        font-size: 1.1rem;
      }
      .comparativa .fila {
        margin-bottom: 14px;
      }
      .etiqueta {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        margin-bottom: 4px;
      }
      .resultado {
        color: var(--ion-color-medium);
      }
      .resultado.gano {
        color: var(--ion-color-success);
      }
      .resultado.pierdo {
        color: var(--ion-color-danger);
      }
      .barras {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .barra {
        flex: 1;
        display: flex;
        height: 14px;
        border-radius: 7px;
        overflow: hidden;
        background: var(--ion-color-step-100, #eee);
      }
      .barra .mia {
        background: var(--ion-color-primary);
      }
      .barra .suya {
        background: var(--ion-color-secondary);
      }
      .valor {
        min-width: 28px;
        text-align: center;
        font-weight: 600;
      }
      .valor.mio {
        color: var(--ion-color-primary);
      }
      .valor.suyo {
        color: var(--ion-color-secondary);
      }
      .leyenda {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: var(--ion-color-medium);
      }
      .punto {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
      }
      .punto.mia {
        background: var(--ion-color-primary);
      }
      .punto.suya {
        background: var(--ion-color-secondary);
        margin-left: 10px;
      }
      .sin-datos {
        margin: 24px 0;
      }
      .duelo {
        margin-top: 18px;
        padding: 12px;
        border-radius: 12px;
        background: var(--ion-color-step-100, rgba(0, 0, 0, 0.05));
      }
      .duelo-cabecera {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
        font-size: 0.9rem;
      }
      .duelo-marcador {
        display: flex;
        justify-content: center;
        align-items: baseline;
        gap: 12px;
        font-size: 1.6rem;
        font-weight: 700;
        margin-top: 6px;
      }
      .duelo-acciones {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 6px;
      }
      .marcador-historico {
        text-align: center;
        font-size: 0.85rem;
        margin: 10px 0 0;
      }
      .acciones {
        margin-top: 24px;
      }
    `,
  ],
})
export class FriendDetailModal implements OnInit {
  @Input({ required: true }) friend!: Friend;
  @Input({ required: true }) me!: MyEntry;
  @Input() privacy: PrivacyLevel = 'todo';
  @Input() challenge: Challenge | null = null;
  @Input() record: DuelRecord | null = null;

  private modalController = inject(ModalController);

  rows: ComparisonRow[] = [];
  lastActivity: string | null = null;
  score: ChallengeScore | null = null;
  name = '';

  ngOnInit(): void {
    const today = new Date();
    this.name = this.friend.displayName || 'Tu amigo';
    this.rows = comparison(this.me, this.friend, today);
    this.lastActivity = lastActivityLabel(this.friend.lastDay, today);
    this.score = this.challenge ? challengeScore(this.challenge, this.me, this.friend, today) : null;
  }

  label(challenge: Challenge): string {
    return challengeLabel(challenge);
  }

  estado(challenge: Challenge): string {
    if (challenge.status === 'pendiente') {
      return challenge.from === this.me.uid ? 'esperando respuesta' : 'te ha retado';
    }
    return this.score?.finished ? 'terminado' : 'en juego';
  }

  get privacyLabel(): string {
    return PRIVACY_LABELS[this.privacy].toLowerCase();
  }

  get privacyNote(): string | null {
    return this.privacy === 'todo' ? null : `Ve de ti: ${this.privacy === 'total' ? 'solo el total' : 'nada'}`;
  }

  // Empate incluido: el texto corto de la derecha de cada fila.
  verdict(row: ComparisonRow): string {
    if (row.mine === row.theirs) {
      return 'empate';
    }
    return row.mine > row.theirs ? `vas +${row.mine - row.theirs}` : `te saca ${row.theirs - row.mine}`;
  }

  // Ancho proporcional dentro de la fila; con 0 y 0 las dos mitades quedan vacías.
  width(value: number, row: ComparisonRow): number {
    const sum = row.mine + row.theirs;
    return sum === 0 ? 0 : (value / sum) * 100;
  }

  act(action: FriendAction): void {
    this.modalController.dismiss(action);
  }

  close(): void {
    this.modalController.dismiss();
  }
}
