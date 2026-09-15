import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DatoDirective } from '../../shared/dato.directive';
import { Friend } from '../../shared/friend.model';
import { LEAGUE_LABELS, LeaguePeriod, LeagueRow, MyEntry, league } from '../../shared/social';

const MEDALS = ['🥇', '🥈', '🥉'];

// Clasificación de mis amigos y yo por semana, mes o total. Se calcula en el dispositivo con
// los datos que ya trae social/{uid}: no cuesta lecturas.
@Component({
  selector: 'app-friends-league',
  standalone: true,
  imports: [CommonModule, IonicModule, DatoDirective],
  template: `
    <div class="liga" *ngIf="rows.length > 1">
      <div class="cabecera">
        <strong>Liga de amigos</strong>
        <ion-segment [value]="period" mode="md" (ionChange)="onPeriodChange($event)" class="periodo-liga">
          <ion-segment-button value="semana"><ion-label>Semana</ion-label></ion-segment-button>
          <ion-segment-button value="mes"><ion-label>Mes</ion-label></ion-segment-button>
          <ion-segment-button value="total"><ion-label>Total</ion-label></ion-segment-button>
        </ion-segment>
      </div>

      <div class="puesto" *ngFor="let row of visibleRows; trackBy: trackByUid" [class.yo]="row.isMe">
        <span class="medalla" aria-hidden="true">{{ medal(row) }}</span>
        <ion-avatar>
          <img [src]="row.photoURL || 'assets/icon-user.svg'" alt="" />
        </ion-avatar>
        <span class="nombre">{{ row.isMe ? 'Tú' : row.displayName || 'Sin nombre' }}</span>
        <span class="delta" *ngIf="row.delta" [class.sube]="row.delta > 0" [class.baja]="row.delta < 0">
          {{ row.delta > 0 ? '▲' : '▼' }}{{ abs(row.delta) }}
        </span>
        <span class="valor" dato>{{ row.value }}</span>
      </div>

      <ion-button *ngIf="rows.length > limit" fill="clear" size="small" (click)="expanded = !expanded" class="ver-liga">
        {{ expanded ? 'Ver menos' : 'Ver la clasificación completa' }}
      </ion-button>
      <p class="nota" *ngIf="period !== 'total'">Quien comparte solo su total no entra en esta clasificación.</p>
    </div>
  `,
  styles: [
    `
      .liga {
        padding: 12px 16px 4px;
      }
      .cabecera {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 8px;
      }
      .puesto {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 10px;
      }
      .puesto.yo {
        background: var(--ion-color-step-100, rgba(0, 0, 0, 0.06));
      }
      .medalla {
        width: 24px;
        text-align: center;
        font-size: 0.95rem;
        color: var(--ion-color-medium);
      }
      ion-avatar {
        width: 32px;
        height: 32px;
      }
      .nombre {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .delta {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
      }
      .delta.sube {
        color: var(--ion-color-success);
      }
      .delta.baja {
        color: var(--ion-color-danger);
      }
      .valor {
        font-weight: 700;
        min-width: 28px;
        text-align: right;
      }
      .nota {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
        margin: 4px 0 0;
      }
    `,
  ],
})
export class FriendsLeagueComponent {
  @Input({ required: true }) set friends(value: Friend[]) {
    this.friendList = value;
    this.recalculate();
  }

  @Input({ required: true }) set me(value: MyEntry | null) {
    this.myEntry = value;
    this.recalculate();
  }

  period: LeaguePeriod = 'semana';
  rows: LeagueRow[] = [];
  expanded = false;
  readonly limit = 5;
  private friendList: Friend[] = [];
  private myEntry: MyEntry | null = null;

  get visibleRows(): LeagueRow[] {
    if (this.expanded) {
      return this.rows;
    }
    const top = this.rows.slice(0, this.limit);
    // Si me quedo fuera del top, mi fila se añade al final para verme siempre.
    const mine = this.rows.find((row) => row.isMe);
    return mine && !top.includes(mine) ? [...top, mine] : top;
  }

  get periodLabel(): string {
    return LEAGUE_LABELS[this.period];
  }

  onPeriodChange(event: CustomEvent): void {
    this.period = event.detail.value as LeaguePeriod;
    this.recalculate();
  }

  medal(row: LeagueRow): string {
    return MEDALS[row.position - 1] ?? `${row.position}.`;
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  trackByUid(_: number, row: LeagueRow): string {
    return row.uid;
  }

  private recalculate(): void {
    this.rows = this.myEntry ? league(this.myEntry, this.friendList, this.period, new Date()) : [];
  }
}
