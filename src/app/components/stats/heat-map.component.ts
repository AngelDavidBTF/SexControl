import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeatCell, HeatMap, WEEKDAY_LABELS } from '../../shared/stats';

// Mapa de actividad por días (columnas = semanas, filas = lunes..domingo). Escala secuencial
// de un solo tono; en modo oscuro (body.dark) los pasos van al revés (más actividad = más claro).
@Component({
  selector: 'app-heat-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail" aria-live="polite">
      <strong *ngIf="selected; else hint">{{ selected.tooltip }}</strong>
      <ng-template #hint><span class="muted">Toca un día para ver cuántas veces</span></ng-template>
    </div>

    <div class="wrap">
      <div class="weekdays" aria-hidden="true">
        <span *ngFor="let label of weekdayLabels; let i = index">{{ i % 2 === 0 ? label : '' }}</span>
      </div>
      <div class="body">
        <div class="months" aria-hidden="true">
          <span *ngFor="let month of map.monthLabels" [style.left.%]="(month.index / map.weeks.length) * 100">{{ month.label }}</span>
        </div>
        <div class="grid" role="grid" [style.grid-template-columns]="'repeat(' + map.weeks.length + ', 1fr)'">
          <div class="week" *ngFor="let week of map.weeks">
            <button
              type="button"
              *ngFor="let cell of week"
              class="cell"
              [class]="'cell level-' + cell.level"
              [class.future]="cell.future"
              [class.selected]="selected?.key === cell.key"
              [disabled]="cell.future"
              [attr.aria-label]="cell.tooltip"
              (pointerenter)="selected = cell"
              (click)="selected = cell"
            ></button>
          </div>
        </div>
      </div>
    </div>

    <div class="scale" aria-hidden="true">
      <span>Menos</span>
      <i class="cell level-0"></i><i class="cell level-1"></i><i class="cell level-2"></i><i class="cell level-3"></i><i class="cell level-4"></i>
      <span>Más</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      --l0: #ebedf0;
      --l1: #dcdfff;
      --l2: #aab1ff;
      --l3: #7a84ff;
      --l4: #4450f0;
    }
    :host-context(body.dark) {
      --l0: #3a3a42;
      --l1: #2b3070;
      --l2: #3b44b0;
      --l3: #5f6bff;
      --l4: #9aa2ff;
    }
    .detail {
      min-height: 22px;
      font-size: 13px;
      margin-bottom: 6px;
    }
    .muted {
      color: var(--ion-color-medium);
    }
    .wrap {
      display: flex;
      gap: 4px;
    }
    .weekdays {
      display: grid;
      grid-template-rows: repeat(7, 1fr);
      gap: 3px;
      margin-top: 16px;
      font-size: 9px;
      color: var(--ion-color-medium);
      width: 10px;
    }
    .weekdays span {
      display: flex;
      align-items: center;
    }
    .body {
      flex: 1;
      min-width: 0;
    }
    .months {
      position: relative;
      height: 14px;
      font-size: 9px;
      color: var(--ion-color-medium);
      margin-bottom: 2px;
    }
    .months span {
      position: absolute;
      top: 0;
      white-space: nowrap;
    }
    .grid {
      display: grid;
      gap: 3px;
    }
    .week {
      display: grid;
      grid-template-rows: repeat(7, 1fr);
      gap: 3px;
    }
    .cell {
      aspect-ratio: 1;
      width: 100%;
      border: 0;
      padding: 0;
      border-radius: 3px;
      background: var(--l0);
      display: block;
    }
    .cell.level-1 {
      background: var(--l1);
    }
    .cell.level-2 {
      background: var(--l2);
    }
    .cell.level-3 {
      background: var(--l3);
    }
    .cell.level-4 {
      background: var(--l4);
    }
    .cell.future {
      opacity: 0.25;
    }
    .cell.selected {
      outline: 2px solid var(--ion-text-color, #000);
      outline-offset: 1px;
    }
    .scale {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 3px;
      margin-top: 8px;
      font-size: 10px;
      color: var(--ion-color-medium);
    }
    .scale i {
      width: 10px;
      height: 10px;
    }
    .scale span {
      margin: 0 4px;
    }
  `,
})
export class HeatMapComponent {
  @Input({ required: true }) map!: HeatMap;

  readonly weekdayLabels = WEEKDAY_LABELS;
  selected: HeatCell | null = null;
}
