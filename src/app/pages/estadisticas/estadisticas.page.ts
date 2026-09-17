import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonItemSliding, IonicModule, ModalController } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, firstValueFrom, map, of, switchMap } from 'rxjs';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { QueryDocumentSnapshot } from '@angular/fire/firestore';
import { AuthService } from '../../core/auth.service';
import { FapEntry, FapService } from '../../core/fap.service';
import { UiService } from '../../core/ui.service';
import { BarChartComponent } from '../../components/stats/bar-chart.component';
import { CalendarioMesComponent } from '../../components/ui/calendario-mes.component';
import { MarcaComponent } from '../../components/ui/marca.component';
import { FapDetails, FapStats } from '../../shared/fap.model';
import { Achievement } from '../../shared/achievements';
import { drawYearCard, yearSummary } from '../../shared/year-card';
import { DatoDirective } from '../../shared/dato.directive';
import { MesCalendario, ultimosMeses } from '../../shared/calendario';
import { FapDetailsModal } from '../../components/fap-details/fap-details.modal';
import { AchievementsService } from '../../core/achievements.service';
import { ProfileService } from '../../core/profile.service';
import { SettingsService } from '../../core/settings.service';
import {
  Bar,
  DateRange,
  Period,
  Streaks,
  TIME_SLOTS,
  Totals,
  WEEKDAY_LABELS,
  WEEKDAY_NAMES,
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
  meses: MesCalendario[];
  tags: TagRow[];
  rating: { average: number; count: number; distribution: { stars: number; count: number; pct: number }[] } | null;
  shareYear: number;
}

interface TagRow {
  tag: string;
  total: number;
  pct: number;
}

const HISTORY_PAGE = 20;

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, BarChartComponent, CalendarioMesComponent, MarcaComponent, DatoDirective],
  templateUrl: './estadisticas.page.html',
  styleUrl: './estadisticas.page.scss',
})
export class EstadisticasPage {
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private ui = inject(UiService);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private achievements = inject(AchievementsService);
  private profiles = inject(ProfileService);
  private settings = inject(SettingsService);

  // Etiqueta del día tocado en el calendario de 6 meses (presentación; no persiste).
  diaCalendario = '';

  get discreto(): boolean {
    return this.settings.discreet().enabled;
  }

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

  // Logros: salen de fapStats, social y la lista de grupos, ya cargados en la sesión.
  readonly achievements$: Observable<Achievement[]> = this.authService.user$.pipe(
    switchMap((user) => {
      if (!user) {
        return of([]);
      }
      // Registra como vistos los ya conseguidos (y avisa de los nuevos desde la última vez).
      void this.achievements.announceNew(user.uid);
      return this.achievements.achievements$(user.uid);
    })
  );

  previewYearCard: string | null = null;
  previewYearName = '';

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
      meses: ultimosMeses(stats.days, now, 6),
      tags: tagRows(stats),
      rating: ratingSummary(stats),
      shareYear: state.period === 'anio' ? state.anchor.getFullYear() : now.getFullYear(),
    };
  }

  // ---------------------------------------------------------------- resumen anual

  async shareYear(year: number): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    const loading = await this.ui.loading('Preparando tu resumen…');
    try {
      const [stats, profile] = await Promise.all([firstValueFrom(this.fapService.stats$(uid)), this.profiles.current(uid)]);
      const blob = await drawYearCard(yearSummary(stats, year), profile.displayName);
      const file = new File([blob], `resumen-${year}.png`, { type: 'image/png' });
      await loading.dismiss();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Mi ${year}` }).catch(() => undefined);
      } else {
        this.previewYearCard = URL.createObjectURL(blob);
        this.previewYearName = file.name;
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error generando el resumen anual', error);
      await this.ui.toast('No se pudo generar el resumen');
    }
  }

  closeYearPreview(): void {
    if (this.previewYearCard) {
      URL.revokeObjectURL(this.previewYearCard);
    }
    this.previewYearCard = null;
  }

  // ---------------------------------------------------------------- detalles de un registro

  async editEntry(entry: FapEntry): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    const stats = await firstValueFrom(this.fapService.stats$(uid));
    const modal = await this.modalController.create({
      component: FapDetailsModal,
      componentProps: {
        details: entry,
        knownTags: tagRows(stats).map((row) => row.tag),
        subtitle: this.formatEntry(entry),
      },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<FapDetails>();
    if (role !== 'confirm' || !data) {
      return;
    }
    try {
      const updated = await this.fapService.updateDetails(uid, entry, data);
      this.history = this.history.map((item) => (item.id === entry.id ? { ...item, ...updated } : item));
      await this.ui.toast('Detalles guardados');
    } catch (error) {
      console.error('Error guardando detalles', error);
      await this.ui.toast('No se pudieron guardar los detalles');
    }
  }

  unlockedCount(list: Achievement[]): number {
    return list.filter((a) => a.unlocked).length;
  }

  stars(value: number | null | undefined): string {
    return value ? '★'.repeat(value) : '';
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
      await this.fapService.removeFap(uid, entry);
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

function tagRows(stats: FapStats): TagRow[] {
  const rows = Object.entries(stats.tags)
    .map(([tag, bucket]) => ({ tag, total: (bucket.s ?? 0) + (bucket.c ?? 0) }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...rows.map((row) => row.total));
  return rows.map((row) => ({ ...row, pct: Math.round((row.total / max) * 100) }));
}

function ratingSummary(stats: FapStats): StatsView['rating'] {
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const bucket = stats.ratings[String(stars)];
    return { stars, count: (bucket?.s ?? 0) + (bucket?.c ?? 0) };
  });
  const count = distribution.reduce((sum, d) => sum + d.count, 0);
  if (count === 0) {
    return null;
  }
  const average = distribution.reduce((sum, d) => sum + d.stars * d.count, 0) / count;
  const max = Math.max(...distribution.map((d) => d.count));
  return { average, count, distribution: distribution.map((d) => ({ ...d, pct: Math.round((d.count / max) * 100) })) };
}
