import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonItemSliding, IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { QueryDocumentSnapshot } from '@angular/fire/firestore';
import { AuthService } from '../../core/auth.service';
import { FapEntry, FapService } from '../../core/fap.service';
import { UiService } from '../../core/ui.service';
import { BarChartComponent } from '../../components/stats/bar-chart.component';
import { HeatMapComponent } from '../../components/stats/heat-map.component';
import { FapStats } from '../../shared/fap.model';
import {
  Bar,
  DateRange,
  HeatMap,
  Period,
  Streaks,
  TIME_SLOTS,
  Totals,
  WEEKDAY_LABELS,
  WEEKDAY_NAMES,
  heatMap,
  indexOfMax,
  periodBars,
  periodRange,
  periodTitle,
  previousLabel,
  previousRange,
  recordDay,
  shiftAnchor,
  streaks,
  sumRange,
  timeSlotTotals,
  weekdayTotals,
  weeklyAverage,
} from '../../shared/stats';

interface PeriodState {
  period: Period;
  anchor: Date;
  custom: DateRange;
}

interface Delta {
  pct: number | null;
  diff: number;
  label: string;
}

interface Insight {
  icon: string;
  label: string;
  value: string;
  detail: string;
}

interface StatsView {
  hasData: boolean;
  title: string;
  canGoNext: boolean;
  totals: Totals;
  pctCompania: number;
  delta: Delta | null;
  bars: Bar[];
  streaks: Streaks;
  insights: Insight[];
  weekdayBars: Bar[];
  timeSlotBars: Bar[];
  heat: HeatMap;
}

const HISTORY_PAGE = 20;

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, BarChartComponent, HeatMapComponent],
  templateUrl: './estadisticas.page.html',
  styleUrl: './estadisticas.page.scss',
})
export class EstadisticasPage {
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private ui = inject(UiService);
  private alertController = inject(AlertController);

  readonly periods: { value: Period; label: string }[] = [
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'anio', label: 'Año' },
    { value: 'siempre', label: 'Siempre' },
    { value: 'rango', label: 'Rango' },
  ];

  private readonly state$ = new BehaviorSubject<PeriodState>({
    period: 'semana',
    anchor: new Date(),
    custom: { start: addDays(startOfDay(new Date()), -29), end: addDays(startOfDay(new Date()), 1) },
  });

  // Todo sale de fapStats/{uid}, el mismo documento que ya escucha Sumar: 0 lecturas extra y
  // se actualiza en vivo al sumar o borrar.
  readonly vm$: Observable<StatsView | null> = combineLatest([
    this.authService.user$.pipe(switchMap((user) => (user ? this.fapService.stats$(user.uid) : of(null)))),
    this.state$,
  ]).pipe(map(([stats, state]) => (stats ? this.buildView(stats, state) : null)));

  // Historial: solo se lee cuando el usuario lo abre, de 20 en 20.
  history: FapEntry[] = [];
  historyOpen = false;
  historyLoading = false;
  private historyCursor: QueryDocumentSnapshot | null = null;
  historyHasMore = false;

  get state(): PeriodState {
    return this.state$.value;
  }

  get customFrom(): string {
    return format(this.state.custom.start, 'yyyy-MM-dd');
  }

  get customTo(): string {
    return format(addDays(this.state.custom.end, -1), 'yyyy-MM-dd');
  }

  get today(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  onPeriodChange(event: CustomEvent): void {
    this.state$.next({ ...this.state, period: event.detail.value as Period, anchor: new Date() });
  }

  move(direction: -1 | 1): void {
    this.state$.next({ ...this.state, anchor: shiftAnchor(this.state.period, this.state.anchor, direction) });
  }

  onCustomChange(which: 'from' | 'to', event: CustomEvent): void {
    const value = event.detail.value as string | undefined;
    if (!value) {
      return;
    }
    const date = parseISO(value);
    let { start, end } = this.state.custom;
    if (which === 'from') {
      start = date;
    } else {
      end = addDays(date, 1);
    }
    if (start >= end) {
      [start, end] = [addDays(end, -1), addDays(start, 1)];
    }
    this.state$.next({ ...this.state, custom: { start, end } });
  }

  private buildView(stats: FapStats, state: PeriodState): StatsView {
    const now = new Date();
    const range = periodRange(state.period, state.anchor, stats.days, state.custom);
    const totals = sumRange(stats.days, range);
    const previous = previousRange(state.period, range);
    const allTime = stats.solitario + stats.compania;

    return {
      hasData: allTime > 0,
      title: periodTitle(state.period, range),
      canGoNext: ['semana', 'mes', 'anio'].includes(state.period) && range.end <= startOfDay(now),
      totals,
      pctCompania: totals.total ? Math.round((totals.compania / totals.total) * 100) : 0,
      delta: previous ? this.delta(totals.total, sumRange(stats.days, previous).total, previousLabel(state.period)) : null,
      bars: periodBars(state.period, range, stats.days),
      streaks: streaks(stats.days, now),
      insights: this.insights(stats, now),
      weekdayBars: weekdayTotals(stats.days).map((bucket, i) => ({
        key: `wd${i}`,
        label: WEEKDAY_LABELS[i],
        tooltip: capitalize(WEEKDAY_NAMES[i]),
        solitario: bucket.s ?? 0,
        compania: bucket.c ?? 0,
      })),
      timeSlotBars: TIME_SLOTS.map((slot, i) => {
        let s = 0;
        let c = 0;
        for (let hour = slot.from; hour < slot.to; hour++) {
          s += stats.hours[String(hour)]?.s ?? 0;
          c += stats.hours[String(hour)]?.c ?? 0;
        }
        return {
          key: `slot${i}`,
          label: `${slot.emoji} ${slot.label}`,
          tooltip: `${slot.label} (${slot.from}:00 – ${slot.to}:00)`,
          solitario: s,
          compania: c,
        };
      }),
      heat: heatMap(stats.days, now),
    };
  }

  private delta(current: number, previous: number, label: string): Delta {
    return {
      diff: current - previous,
      pct: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null,
      label,
    };
  }

  private insights(stats: FapStats, now: Date): Insight[] {
    const record = recordDay(stats.days);
    const weekday = indexOfMax(weekdayTotals(stats.days).map((b) => (b.s ?? 0) + (b.c ?? 0)));
    const slot = indexOfMax(timeSlotTotals(stats.hours));
    const average = weeklyAverage(stats.days, now);
    return [
      {
        icon: '🏆',
        label: 'Récord en un día',
        value: record ? String(record.total) : '—',
        detail: record ? record.label : 'Sin datos todavía',
      },
      {
        icon: '📅',
        label: 'Día favorito',
        value: weekday !== null ? capitalize(WEEKDAY_NAMES[weekday]) : '—',
        detail: 'El día de la semana con más',
      },
      {
        icon: slot !== null ? TIME_SLOTS[slot].emoji : '🕒',
        label: 'Franja favorita',
        value: slot !== null ? TIME_SLOTS[slot].label : '—',
        detail: slot !== null ? `De ${TIME_SLOTS[slot].from}:00 a ${TIME_SLOTS[slot].to}:00` : 'Sin datos todavía',
      },
      {
        icon: '📈',
        label: 'Media semanal',
        value: average.toLocaleString('es-ES', { maximumFractionDigits: 1 }),
        detail: 'Desde tu primer registro',
      },
    ];
  }

  // ---------------------------------------------------------------- historial

  async openHistory(): Promise<void> {
    this.historyOpen = true;
    this.history = [];
    this.historyCursor = null;
    await this.loadMoreHistory();
  }

  async loadMoreHistory(): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid || this.historyLoading) {
      return;
    }
    this.historyLoading = true;
    try {
      const page = await this.fapService.fapsPage(uid, HISTORY_PAGE, this.historyCursor);
      this.history = [...this.history, ...page.entries];
      this.historyCursor = page.next;
      this.historyHasMore = page.next !== null;
    } catch (error) {
      console.error('Error cargando historial', error);
      await this.ui.toast('No se pudo cargar el historial');
    } finally {
      this.historyLoading = false;
    }
  }

  formatEntry(entry: FapEntry): string {
    return entry.fecha ? capitalize(format(entry.fecha, "EEEE d 'de' MMMM 'de' yyyy · HH:mm", { locale: es })) : 'Guardando…';
  }

  async confirmDelete(entry: FapEntry, sliding: IonItemSliding): Promise<void> {
    await sliding.close();
    const alert = await this.alertController.create({
      header: 'Borrar registro',
      message: `¿Borrar el registro del ${this.formatEntry(entry).toLowerCase()}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive', handler: () => void this.deleteEntry(entry) },
      ],
    });
    await alert.present();
  }

  private async deleteEntry(entry: FapEntry): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    try {
      await this.fapService.removeFap(uid, entry.snapshot);
      this.history = this.history.filter((item) => item.id !== entry.id);
      await this.ui.toast('Registro borrado');
    } catch (error) {
      console.error('Error borrando registro', error);
      await this.ui.toast('No se pudo borrar el registro');
    }
  }

  trackById(_: number, entry: FapEntry): string {
    return entry.id;
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
