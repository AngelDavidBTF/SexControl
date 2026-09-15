import { differenceInCalendarDays, parseISO } from 'date-fns';
import { FapStats } from './fap.model';
import { Friend, PeriodCount, SocialEntry } from './friend.model';
import {
  currentMonthTotals,
  currentWeekTotals,
  lastActiveDayKey,
  monthKey,
  previousWeekKey,
  previousWeekTotals,
  streaks,
  weekKey,
} from './stats';

// Funciones puras para la ficha del amigo y la liga: trabajan sobre lo que cada persona ya
// publica en social/{uid} (ver sharing.service.ts), así que no cuestan lecturas.

export type LeaguePeriod = 'semana' | 'mes' | 'total';

export const LEAGUE_LABELS: Record<LeaguePeriod, string> = {
  semana: 'Esta semana',
  mes: 'Este mes',
  total: 'Total',
};

// Mis propios datos con la misma forma que los de un amigo, para compararme sin casos aparte.
export interface MyEntry extends SocialEntry {
  uid: string;
}

export interface LeagueRow {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  isMe: boolean;
  value: number;
  // Posición (1 = primero). Los empates comparten posición.
  position: number;
  // Puestos ganados (+) o perdidos (-) respecto al periodo anterior; null si no se puede saber.
  delta: number | null;
}

export interface ComparisonRow {
  label: string;
  mine: number;
  theirs: number;
}

export function myEntry(uid: string, profile: { displayName: string | null; photoURL: string | null }, stats: FapStats, today: Date): MyEntry {
  const week = currentWeekTotals(stats.days, today);
  const month = currentMonthTotals(stats.days, today);
  const prevWeek = previousWeekTotals(stats.days, today);
  return {
    uid,
    displayName: profile.displayName,
    email: null,
    photoURL: profile.photoURL,
    solitario: stats.solitario,
    compania: stats.compania,
    total: stats.solitario + stats.compania,
    week: { key: weekKey(today), s: week.solitario, c: week.compania },
    month: { key: monthKey(today), s: month.solitario, c: month.compania },
    prevWeek: { key: previousWeekKey(today), s: prevWeek.solitario, c: prevWeek.compania },
    streak: streaks(stats.days, today).current,
    lastDay: lastActiveDayKey(stats.days),
    hidden: false,
  };
}

// Un recuento solo vale para el periodo cuya clave trae: si es de otra semana o mes, la persona
// no ha sumado en el periodo actual y cuenta como 0.
function countFor(count: PeriodCount | null | undefined, key: string): number {
  return count && count.key === key ? count.s + count.c : 0;
}

// Cuántas veces en el periodo. null si esa persona no lo comparte.
export function periodValue(entry: SocialEntry, period: LeaguePeriod, today: Date): number | null {
  if (entry.hidden) {
    return null;
  }
  if (period === 'total') {
    return entry.total ?? (entry.solitario ?? 0) + (entry.compania ?? 0);
  }
  const count = period === 'semana' ? entry.week : entry.month;
  // Con privacidad "solo el total" los periodos llegan a null (y en datos antiguos, sin definir):
  // esa persona no entra en la clasificación del periodo.
  if (count == null) {
    return null;
  }
  return countFor(count, period === 'semana' ? weekKey(today) : monthKey(today));
}

// Clasificación de mis amigos y yo. Quien no comparta el periodo se queda fuera.
export function league(me: MyEntry, friends: Friend[], period: LeaguePeriod, today: Date): LeagueRow[] {
  const rows = [me, ...friends]
    .map((entry) => {
      const value = periodValue(entry, period, today);
      return value === null
        ? null
        : {
            uid: entry.uid,
            displayName: entry.displayName,
            photoURL: entry.photoURL,
            isMe: entry.uid === me.uid,
            value,
            // Solo hay periodo anterior si esa persona lo publica: si no, no se dibujan flechas.
            previous: period === 'semana' && entry.prevWeek ? countFor(entry.prevWeek, previousWeekKey(today)) : null,
          };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.value - a.value || (a.displayName ?? '').localeCompare(b.displayName ?? ''));

  // Solo la liga semanal compara con el periodo anterior, y solo si TODOS lo publican: si a
  // alguien le falta, su 0 daría una posición falsa y las flechas mentirían.
  const previousOrder = rows.some((row) => row.previous === null)
    ? null
    : positions([...rows].sort((a, b) => (b.previous ?? 0) - (a.previous ?? 0)).map((row) => ({ uid: row.uid, value: row.previous ?? 0 })));

  const current = positions(rows.map((row) => ({ uid: row.uid, value: row.value })));
  return rows.map((row) => ({
    uid: row.uid,
    displayName: row.displayName,
    photoURL: row.photoURL,
    isMe: row.isMe,
    value: row.value,
    position: current.get(row.uid)!,
    delta: previousOrder ? previousOrder.get(row.uid)! - current.get(row.uid)! : null,
  }));
}

// Posición de cada uid en una lista ya ordenada de mayor a menor, con empates compartidos.
function positions(sorted: { uid: string; value: number }[]): Map<string, number> {
  const result = new Map<string, number>();
  sorted.forEach((row, index) => {
    const previous = index > 0 ? sorted[index - 1] : null;
    result.set(row.uid, previous && previous.value === row.value ? result.get(previous.uid)! : index + 1);
  });
  return result;
}

// Filas "tú vs él" de la ficha. Solo las que el amigo comparte.
export function comparison(me: MyEntry, friend: Friend, today: Date): ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  for (const period of ['semana', 'mes', 'total'] as LeaguePeriod[]) {
    const theirs = periodValue(friend, period, today);
    const mine = periodValue(me, period, today);
    if (theirs !== null && mine !== null) {
      rows.push({ label: LEAGUE_LABELS[period], mine, theirs });
    }
  }
  return rows;
}

// "hoy", "ayer", "hace 3 días"... a partir del último día con actividad que comparte.
export function lastActivityLabel(lastDay: string | null | undefined, today: Date): string | null {
  if (!lastDay) {
    return null;
  }
  const days = differenceInCalendarDays(today, parseISO(lastDay));
  if (days <= 0) {
    return 'hoy';
  }
  if (days === 1) {
    return 'ayer';
  }
  return `hace ${days} días`;
}
