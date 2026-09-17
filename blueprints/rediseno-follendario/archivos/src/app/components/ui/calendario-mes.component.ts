import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CeldaDia, MesCalendario } from '../../shared/calendario';

export interface UltimoApunte {
  tipo: 'c' | 's';
  // Sube en cada apunte: al cambiar, el cubo, el sello y la onda se vuelven a animar.
  seq: number;
}

// El calendario del logo: casillas rosa (compañía), cian (solitario) o partidas (los dos).
// Al apuntar, sobre la casilla de hoy cae un cubo y se estampa un sello (CSS en _componentes.scss).
@Component({
  selector: 'app-calendario-mes',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="f-month-wd" aria-hidden="true">
      <span *ngFor="let dia of diasSemana">{{ dia }}</span>
    </div>
    <div class="f-month-grid" role="group" [attr.aria-label]="mes.nombre + ' de ' + mes.anio">
      <span *ngFor="let hueco of huecos" aria-hidden="true"></span>
      <button
        type="button"
        *ngFor="let celda of mes.celdas; trackBy: porClave"
        class="f-mcell"
        [ngClass]="celda.tipo"
        [class.today]="celda.hoy"
        [class.future]="celda.futuro"
        [class.sel]="seleccionada === celda.clave"
        [disabled]="celda.futuro"
        [attr.aria-label]="celda.etiqueta"
        (click)="elegir(celda)"
      >
        {{ celda.dia }}
        <span class="x" *ngIf="celda.total > 1">×{{ celda.total }}</span>
        <ng-container *ngIf="celda.hoy && ultimoApunte">
          <ng-container *ngFor="let apunte of [ultimoApunte]; trackBy: porSeq">
            <svg class="f-cellcube" [ngClass]="apunte.tipo" width="18" height="19" viewBox="0 0 30 31" aria-hidden="true">
              <polygon class="t" points="15,0 30,7.5 15,15 0,7.5" />
              <polygon class="l" points="0,7.5 15,15 15,31 0,23.5" />
              <polygon class="r" points="30,7.5 15,15 15,31 30,23.5" />
            </svg>
            <span class="f-stamp" aria-hidden="true">
              <svg *ngIf="discreto" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="var(--f-cal-ink)" /></svg>
              <svg *ngIf="!discreto && apunte.tipo === 'c'" viewBox="0 0 24 24">
                <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="var(--f-pink)" stroke="var(--f-cal-ink)" stroke-width="1.2" />
              </svg>
              <svg *ngIf="!discreto && apunte.tipo === 's'" viewBox="0 0 24 24">
                <path d="M12 2.5c.8 5 2.9 7.8 9.5 9.5-6.6 1.7-8.7 4.5-9.5 9.5-.8-5-2.9-7.8-9.5-9.5 6.6-1.7 8.7-4.5 9.5-9.5z" fill="var(--f-solo)" stroke="var(--f-cal-ink)" stroke-width="1.2" />
              </svg>
            </span>
            <span class="f-ripple" aria-hidden="true"></span>
          </ng-container>
        </ng-container>
      </button>
    </div>
  `,
})
export class CalendarioMesComponent {
  @Input({ required: true }) mes!: MesCalendario;
  @Input() ultimoApunte: UltimoApunte | null = null;
  @Input() discreto = false;
  @Output() readonly diaElegido = new EventEmitter<CeldaDia>();

  readonly diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  seleccionada: string | null = null;

  get huecos(): number[] {
    return Array.from({ length: this.mes.hueco }, (_, i) => i);
  }

  elegir(celda: CeldaDia): void {
    this.seleccionada = celda.clave;
    this.diaElegido.emit(celda);
  }

  porClave = (_: number, celda: CeldaDia): string => celda.clave;
  porSeq = (_: number, apunte: UltimoApunte): number => apunte.seq;
}
