import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { DayBuckets, HourBuckets, StatsBucket } from './fap.model';

// Funciones puras sobre los recuentos por día/hora de fapStats (ver fap.service.ts). Las claves
// de día son 'yyyy-MM-dd' en hora local, así que se comparan como texto.

export type Period = 'semana' | 'mes' | 'anio' | 'siempre' | 'rango';

export interface DateRange {
  start: Date;
  // Exclusivo.
  end: Date;
}

export interface Totals {
  solitario: number;
  compania: number;
  total: number;
  activeDays: number;
}

export interface Bar {
  key: string;
  label: string;
  tooltip: string;
  solitario: number;
  compania: number;
}

export interface HeatCell {
  key: string;
  total: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
  tooltip: string;
}

export interface HeatMap {
  weeks: HeatCell[][];
  monthLabels: { index: number; label: string }[];
}

const WEEK = { weekStartsOn: 1 as const, locale: es };

export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function hourKey(date: Date): string {
  return String(date.getHours());
}

export function bucketTotal(bucket: StatsBucket | undefined): number {
  return (bucket?.s ?? 0) + (bucket?.c ?? 0);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function activeKeys(days: DayBuckets): string[] {
  return Object.keys(days)
    .filter((key) => bucketTotal(days[key]) > 0)
    .sort();
}

export function firstActiveDay(days: DayBuckets): Date | null {
  const [first] = activeKeys(days);
  return first ? parseISO(first) : null;
}

// ---------------------------------------------------------------- periodos

export function periodRange(period: Period, anchor: Date, days: DayBuckets, custom?: DateRange): DateRange {
  switch (period) {
    case 'semana': {
      const start = startOfWeek(anchor, WEEK);
      return { start, end: addWeeks(start, 1) };
    }
    case 'mes': {
      const start = startOfMonth(anchor);
      return { start, end: addMonths(start, 1) };
    }
    case 'anio': {
      const start = startOfYear(anchor);
      return { start, end: addYears(start, 1) };
    }
    case 'siempre': {
      const today = startOfDay(new Date());
      return { start: firstActiveDay(days) ?? today, end: addDays(today, 1) };
    }
    case 'rango':
      return custom ?? { start: startOfDay(anchor), end: addDays(startOfDay(anchor), 1) };
  }
}

export function shiftAnchor(period: Period, anchor: Date, direction: -1 | 1): Date {
  switch (period) {
    case 'semana':
      return addWeeks(anchor, direction);
    case 'mes':
      return addMonths(anchor, direction);
    case 'anio':
      return addYears(anchor, direction);
    default:
      return anchor;
  }
}

// Periodo inmediatamente anterior del mismo tamaño, para comparar. null en "siempre".
export function previousRange(period: Period, range: DateRange): DateRange | null {
  switch (period) {
    case 'semana':
      return { start: addWeeks(range.start, -1), end: range.start };
    case 'mes':
      return { start: addMonths(range.start, -1), end: range.start };
    case 'anio':
      return { start: addYears(range.start, -1), end: range.start };
    case 'rango': {
      const length = differenceInCalendarDays(range.end, range.start);
      return { start: addDays(range.start, -length), end: range.start };
    }
    default:
      return null;
  }
}

export function periodTitle(period: Period, range: DateRange): string {
  const last = subDays(range.end, 1);
  switch (period) {
    case 'semana':
      return range.start.getMonth() === last.getMonth()
        ? `${format(range.start, 'd', WEEK)} – ${format(last, "d 'de' MMMM 'de' yyyy", WEEK)}`
        : `${format(range.start, 'd MMM', WEEK)} – ${format(last, 'd MMM yyyy', WEEK)}`;
    case 'mes':
      return capitalize(format(range.start, 'MMMM yyyy', WEEK));
    case 'anio':
      return format(range.start, 'yyyy');
    case 'siempre':
      return `Desde el ${format(range.start, "d 'de' MMMM 'de' yyyy", WEEK)}`;
    case 'rango':
      return `${format(range.start, 'd MMM yyyy', WEEK)} – ${format(last, 'd MMM yyyy', WEEK)}`;
  }
}

// Texto para "vs ..." en la comparación.
export function previousLabel(period: Period): string {
  return { semana: 'la semana anterior', mes: 'el mes anterior', anio: 'el año anterior', rango: 'el periodo anterior', siempre: '' }[
    period
  ];
}

// ---------------------------------------------------------------- agregados

export function sumRange(days: DayBuckets, range: DateRange): Totals {
  const startKey = dayKey(range.start);
  const endKey = dayKey(range.end);
  const totals: Totals = { solitario: 0, compania: 0, total: 0, activeDays: 0 };
  for (const [key, bucket] of Object.entries(days)) {
    if (key >= startKey && key < endKey && bucketTotal(bucket) > 0) {
      totals.solitario += bucket.s ?? 0;
      totals.compania += bucket.c ?? 0;
      totals.activeDays++;
    }
  }
  totals.total = totals.solitario + totals.compania;
  return totals;
}

type Granularity = 'day' | 'month' | 'year';

function granularityFor(period: Period, range: DateRange): Granularity {
  if (period === 'semana' || period === 'mes') {
    return 'day';
  }
  if (period === 'anio') {
    return 'month';
  }
  const length = differenceInCalendarDays(range.end, range.start);
  if (length <= 45) {
    return 'day';
  }
  return length <= 730 ? 'month' : 'year';
}

// Barras apiladas del periodo, con la granularidad que tenga sentido para su duración.
export function periodBars(period: Period, range: DateRange, days: DayBuckets): Bar[] {
  const granularity = granularityFor(period, range);
  const bars: Bar[] = [];
  const add = (key: string, label: string, tooltip: string, bucket: StatsBucket) =>
    bars.push({ key, label, tooltip, solitario: bucket.s ?? 0, compania: bucket.c ?? 0 });

  if (granularity === 'day') {
    for (let date = range.start; date < range.end; date = addDays(date, 1)) {
      const label = period === 'semana' ? capitalize(format(date, 'EEEEEE', WEEK)) : format(date, 'd');
      add(dayKey(date), label, capitalize(format(date, "EEEE d 'de' MMMM", WEEK)), days[dayKey(date)] ?? {});
    }
    return bars;
  }

  const sliceLength = granularity === 'month' ? 7 : 4;
  const startKey = dayKey(range.start);
  const endKey = dayKey(range.end);
  const grouped = new Map<string, StatsBucket>();
  for (const [key, bucket] of Object.entries(days)) {
    // Solo días dentro del rango, aunque el primer/último mes o año quede incompleto.
    if (key < startKey || key >= endKey) {
      continue;
    }
    const group = key.slice(0, sliceLength);
    const acc = grouped.get(group) ?? { s: 0, c: 0 };
    grouped.set(group, { s: (acc.s ?? 0) + (bucket.s ?? 0), c: (acc.c ?? 0) + (bucket.c ?? 0) });
  }

  const step = granularity === 'month' ? (d: Date) => addMonths(d, 1) : (d: Date) => addYears(d, 1);
  const first = granularity === 'month' ? startOfMonth(range.start) : startOfYear(range.start);
  for (let date = first; date < range.end; date = step(date)) {
    const group = format(date, granularity === 'month' ? 'yyyy-MM' : 'yyyy');
    const label = granularity === 'month' ? capitalize(format(date, 'MMM', WEEK)).replace('.', '') : format(date, 'yyyy');
    const tooltip = granularity === 'month' ? capitalize(format(date, 'MMMM yyyy', WEEK)) : group;
    add(group, label, tooltip, grouped.get(group) ?? {});
  }
  return bars;
}

// ---------------------------------------------------------------- curiosidades

export interface Streaks {
  current: number;
  best: number;
  daysSinceLast: number | null;
}

// La racha actual sigue viva si hubo actividad hoy o ayer.
export function streaks(days: DayBuckets, today: Date): Streaks {
  const keys = activeKeys(days);
  if (keys.length === 0) {
    return { current: 0, best: 0, daysSinceLast: null };
  }

  let best = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i++) {
    run = differenceInCalendarDays(parseISO(keys[i]), parseISO(keys[i - 1])) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const last = parseISO(keys[keys.length - 1]);
  const daysSinceLast = differenceInCalendarDays(today, last);
  let current = 0;
  if (daysSinceLast <= 1) {
    current = 1;
    for (let i = keys.length - 1; i > 0; i--) {
      if (differenceInCalendarDays(parseISO(keys[i]), parseISO(keys[i - 1])) !== 1) {
        break;
      }
      current++;
    }
  }
  return { current, best, daysSinceLast };
}

export function recordDay(days: DayBuckets): { label: string; total: number } | null {
  let best: { key: string; total: number } | null = null;
  for (const [key, bucket] of Object.entries(days)) {
    const total = bucketTotal(bucket);
    if (total > 0 && (!best || total > best.total)) {
      best = { key, total };
    }
  }
  return best ? { total: best.total, label: format(parseISO(best.key), "d 'de' MMMM 'de' yyyy", WEEK) } : null;
}

export const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Totales por día de la semana, empezando en lunes.
export function weekdayTotals(days: DayBuckets): StatsBucket[] {
  const totals: StatsBucket[] = Array.from({ length: 7 }, () => ({ s: 0, c: 0 }));
  for (const [key, bucket] of Object.entries(days)) {
    const index = (parseISO(key).getDay() + 6) % 7;
    totals[index].s! += bucket.s ?? 0;
    totals[index].c! += bucket.c ?? 0;
  }
  return totals;
}

export const TIME_SLOTS = [
  { label: 'Madrugada', emoji: '🌙', from: 0, to: 6 },
  { label: 'Mañana', emoji: '☀️', from: 6, to: 12 },
  { label: 'Tarde', emoji: '🌇', from: 12, to: 20 },
  { label: 'Noche', emoji: '🌃', from: 20, to: 24 },
];

export function timeSlotTotals(hours: HourBuckets): number[] {
  return TIME_SLOTS.map((slot) => {
    let total = 0;
    for (let hour = slot.from; hour < slot.to; hour++) {
      total += bucketTotal(hours[String(hour)]);
    }
    return total;
  });
}

export function indexOfMax(values: number[]): number | null {
  const max = Math.max(...values, 0);
  return max > 0 ? values.indexOf(max) : null;
}

export function weeklyAverage(days: DayBuckets, today: Date): number {
  const first = firstActiveDay(days);
  if (!first) {
    return 0;
  }
  const total = Object.values(days).reduce((sum, bucket) => sum + bucketTotal(bucket), 0);
  const weeks = Math.max(1, (differenceInCalendarDays(today, first) + 1) / 7);
  return total / weeks;
}

// ---------------------------------------------------------------- mapa de actividad

// Últimas `weekCount` semanas hasta la actual, en columnas de lunes a domingo.
export function heatMap(days: DayBuckets, today: Date, weekCount = 26): HeatMap {
  const currentWeek = startOfWeek(today, WEEK);
  const firstWeek = addWeeks(currentWeek, -(weekCount - 1));
  const max = Math.max(1, ...Object.values(days).map(bucketTotal));
  const todayKey = dayKey(today);

  const weeks: HeatCell[][] = [];
  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < weekCount; w++) {
    const weekStart = addWeeks(firstWeek, w);
    if (weekStart.getMonth() !== lastMonth) {
      monthLabels.push({ index: w, label: capitalize(format(weekStart, 'MMM', WEEK)).replace('.', '') });
      lastMonth = weekStart.getMonth();
    }
    const week: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d);
      const key = dayKey(date);
      const total = bucketTotal(days[key]);
      const ratio = total / max;
      const level = total === 0 ? 0 : ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
      week.push({
        key,
        total,
        level,
        future: key > todayKey,
        tooltip: `${capitalize(format(date, "EEEE d 'de' MMMM", WEEK))}: ${total}`,
      });
    }
    weeks.push(week);
  }
  // Si el primer mes solo asoma una o dos semanas, su etiqueta pisaría la del siguiente.
  if (monthLabels.length > 1 && monthLabels[1].index - monthLabels[0].index < 3) {
    monthLabels.shift();
  }
  return { weeks, monthLabels };
}

// ---------------------------------------------------------------- periodos actuales

// Clave de la semana: el lunes en 'yyyy-MM-dd'. Clave del mes: 'yyyy-MM'.
export function weekKey(date: Date): string {
  return dayKey(startOfWeek(date, WEEK));
}

export function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function currentWeekTotals(days: DayBuckets, today: Date): Totals {
  const start = startOfWeek(today, WEEK);
  return sumRange(days, { start, end: addWeeks(start, 1) });
}

export function currentMonthTotals(days: DayBuckets, today: Date): Totals {
  const start = startOfMonth(today);
  return sumRange(days, { start, end: addMonths(start, 1) });
}

// ¿Alguna semana (lunes-domingo) llegó a `goal`?
export function anyWeekReached(days: DayBuckets, goal: number): boolean {
  const weeks = new Map<string, number>();
  for (const [key, bucket] of Object.entries(days)) {
    const week = weekKey(parseISO(key));
    weeks.set(week, (weeks.get(week) ?? 0) + bucketTotal(bucket));
  }
  return [...weeks.values()].some((total) => total >= goal);
}
