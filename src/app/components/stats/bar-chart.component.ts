import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Bar } from '../../shared/stats';

interface Column extends Bar {
  total: number;
  heightPct: number;
  showLabel: boolean;
}

// Barras apiladas (compañía abajo, solitario arriba) en HTML/CSS: se adaptan al ancho sin
// deformar el texto. Tocar o pasar el ratón por una barra muestra su detalle.
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legend" *ngIf="showLegend" aria-hidden="true">
      <span><i class="swatch compania"></i>Compañía</span>
      <span><i class="swatch solitario"></i>Solitario</span>
    </div>

    <div class="detail" aria-live="polite">
      <ng-container *ngIf="selected !== null && columns[selected] as col; else hint">
        <strong>{{ col.tooltip }}</strong>
        <span>{{ col.total }} en total · {{ col.compania }} compañía · {{ col.solitario }} solitario</span>
      </ng-container>
      <ng-template #hint><span class="muted">{{ emptyHint }}</span></ng-template>
    </div>

    <div class="plot" [style.height.px]="height">
      <div class="grid" aria-hidden="true">
        <div class="line" *ngFor="let tick of ticks" [style.bottom.%]="(tick / max) * 100">
          <span>{{ tick }}</span>
        </div>
      </div>

      <div class="columns" (pointerleave)="selected = pinned">
        <button
          type="button"
          class="column"
          *ngFor="let col of columns; let i = index; trackBy: trackByKey"
          [class.selected]="selected === i"
          [attr.aria-label]="col.tooltip + ': ' + col.total"
          (pointerenter)="selected = i"
          (click)="toggle(i)"
        >
          <div class="stack" [style.height.%]="col.heightPct">
            <div class="seg solitario" *ngIf="col.solitario" [style.flex-grow]="col.solitario"></div>
            <div class="seg compania" *ngIf="col.compania" [style.flex-grow]="col.compania"></div>
          </div>
        </button>
      </div>
    </div>

    <div class="labels" aria-hidden="true">
      <span *ngFor="let col of columns; trackBy: trackByKey">{{ col.showLabel ? col.label : '' }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      --gap: 2px;
      --compania: var(--f-pink);
      --solitario: var(--f-solo);
    }
    .legend {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--f-muted);
      margin-bottom: 6px;
    }
    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .swatch {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      display: inline-block;
    }
    .swatch.compania,
    .seg.compania {
      background: var(--compania);
    }
    .swatch.solitario,
    .seg.solitario {
      background: var(--solitario);
    }
    .detail {
      min-height: 38px;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-bottom: 8px;
    }
    .detail strong {
      font-weight: 600;
    }
    .muted {
      color: var(--f-muted);
    }
    .plot {
      position: relative;
      margin-left: 22px;
    }
    .grid .line {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px solid var(--f-line);
    }
    .grid .line span {
      position: absolute;
      left: -22px;
      top: -8px;
      width: 18px;
      text-align: right;
      font-size: 10px;
      color: var(--f-muted);
    }
    .columns {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-end;
      gap: var(--gap);
    }
    .column {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      background: transparent;
      border: 0;
      padding: 0;
      border-radius: 6px;
      cursor: pointer;
    }
    .column.selected {
      background: var(--f-surface-2);
    }
    .stack {
      width: 100%;
      max-width: 24px;
      display: flex;
      flex-direction: column;
      gap: var(--gap);
      border-radius: 4px 4px 0 0;
      overflow: hidden;
      transition: height 0.35s ease;
    }
    .seg {
      min-height: 2px;
    }
    .labels {
      display: flex;
      gap: var(--gap);
      margin-left: 22px;
      margin-top: 4px;
    }
    .labels span {
      flex: 1;
      text-align: center;
      font-size: 10px;
      color: var(--f-muted);
      white-space: nowrap;
      overflow: visible;
    }
  `,
})
export class BarChartComponent implements OnChanges {
  @Input({ required: true }) bars: Bar[] = [];
  @Input() height = 160;
  @Input() showLegend = true;
  @Input() emptyHint = 'Toca una barra para ver el detalle';

  columns: Column[] = [];
  ticks: number[] = [];
  max = 1;
  selected: number | null = null;
  pinned: number | null = null;

  ngOnChanges(): void {
    const totals = this.bars.map((bar) => bar.solitario + bar.compania);
    this.max = niceMax(Math.max(0, ...totals));
    this.ticks = this.max <= 1 ? [this.max] : [Math.round(this.max / 2), this.max];
    // Con muchas barras se etiqueta solo una de cada `step` para que no se pisen.
    const step = this.bars.length > 16 ? Math.ceil(this.bars.length / 7) : 1;
    this.columns = this.bars.map((bar, i) => ({
      ...bar,
      total: totals[i],
      heightPct: (totals[i] / this.max) * 100,
      showLabel: i % step === 0,
    }));
    if (this.selected !== null && this.selected >= this.columns.length) {
      this.selected = this.pinned = null;
    }
  }

  toggle(index: number): void {
    this.pinned = this.pinned === index ? null : index;
    this.selected = this.pinned;
  }

  trackByKey(_: number, bar: Bar): string {
    return bar.key;
  }
}

// Techo "redondo" para el eje: 1, 2, 4, 5, 10, 20, 25, 50...
function niceMax(value: number): number {
  if (value <= 1) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const factor of [1, 2, 2.5, 4, 5, 10]) {
    const candidate = factor * magnitude;
    if (candidate >= value && Number.isInteger(candidate / 2)) {
      return candidate;
    }
  }
  return 10 * magnitude;
}
