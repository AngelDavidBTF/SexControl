import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Group, GroupMember, Season } from './group.model';
import { monthKey, previousMonthKey, previousWeekKey, weekKey } from './stats';

// Temporadas, títulos semanales y objetivo colectivo. Todo se calcula en el dispositivo a partir
// del documento del grupo, que ya está cargado: no cuesta lecturas.

export interface MemberStat {
  uid: string;
  name: string;
  week: number;
  prevWeek: number | null;
  month: number;
  total: number;
  streak: number | null;
  // Días desde su último registro; null si no lo comparte o nunca ha sumado.
  idleDays: number | null;
}

export interface Title {
  id: string;
  emoji: string;
  title: string;
  uid: string;
  name: string;
  detail: string;
}

export interface GoalProgress {
  period: 'semana' | 'mes';
  target: number;
  current: number;
  percent: number;
  done: boolean;
}

export interface SeasonToClose extends Season {
  key: string;
}

export interface SeasonEntry extends Season {
  key: string;
  // 'Septiembre de 2026'.
  label: string;
}

function memberName(member: GroupMember | undefined, uid: string): string {
  return member?.displayName?.trim() || `Miembro ${uid.slice(0, 4)}`;
}

// Recuento de un periodo concreto: solo vale si la clave publicada es la de ese periodo.
function countFor(entry: { key: string; s: number; c: number } | null | undefined, key: string): number | null {
  if (entry == null) {
    return null;
  }
  return entry.key === key ? entry.s + entry.c : 0;
}

// Miembros que comparten sus números, con lo necesario para los títulos y las temporadas.
export function memberStats(group: Group, now: Date): MemberStat[] {
  const week = weekKey(now);
  const prevWeek = previousWeekKey(now);
  const month = monthKey(now);
  return group.memberUids
    .map((uid) => ({ uid, member: group.members?.[uid] }))
    .filter((entry): entry is { uid: string; member: GroupMember } => !!entry.member && entry.member.hidden !== true)
    .map(({ uid, member }) => ({
      uid,
      name: memberName(member, uid),
      week: countFor(member.week, week) ?? 0,
      prevWeek: countFor(member.prevWeek, prevWeek),
      month: countFor(member.month, month) ?? 0,
      total: (member.solitario ?? 0) + (member.compania ?? 0),
      streak: member.streak ?? null,
      idleDays: member.lastDay ? differenceInCalendarDays(now, parseISO(member.lastDay)) : null,
    }));
}

// ---------------------------------------------------------------- temporadas

// El mes pasado ya cerrado, si nadie lo ha guardado aún. null si no hay nada que cerrar: ya está
// guardado, el grupo es más nuevo que ese mes o ningún miembro publicó datos de aquel mes.
export function seasonToClose(group: Group, now: Date): SeasonToClose | null {
  const key = previousMonthKey(now);
  if (group.seasons?.[key]) {
    return null;
  }
  // El valor del mes cerrado está en prevMonth (o todavía en month, si esa persona no ha sumado
  // desde que empezó el mes nuevo).
  const values = group.memberUids
    .map((uid) => {
      const member = group.members?.[uid];
      if (!member || member.hidden === true) {
        return null;
      }
      const value = countFor(member.prevMonth, key) ?? countFor(member.month, key);
      return value === null ? null : { uid, name: memberName(member, uid), value };
    })
    .filter((entry): entry is { uid: string; name: string; value: number } => entry !== null);

  if (values.length === 0) {
    return null;
  }
  const best = values.reduce((top, entry) => (entry.value > top.value ? entry : top));
  const total = values.reduce((sum, entry) => sum + entry.value, 0);
  return best.value > 0
    ? { key, winnerUid: best.uid, winnerName: best.name, total }
    : { key, winnerUid: null, winnerName: null, total: 0 };
}

// Palmarés de más reciente a más antiguo.
export function seasonHistory(group: Group): SeasonEntry[] {
  return Object.entries(group.seasons ?? {})
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, season]) => ({
      ...season,
      key,
      label: capitalize(format(parseISO(`${key}-01`), 'MMMM yyyy', { locale: es })),
    }));
}

// Campeón del mes pasado, para la corona junto al nombre.
export function reigningChampion(group: Group, now: Date): string | null {
  return group.seasons?.[previousMonthKey(now)]?.winnerUid ?? null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------- títulos semanales

// Un miembro no puede llevarse dos veces el mismo título, pero sí títulos distintos.
export function weeklyTitles(group: Group, now: Date): Title[] {
  const stats = memberStats(group, now);
  if (stats.length === 0) {
    return [];
  }
  const titles: Title[] = [];
  const add = (id: string, emoji: string, title: string, stat: MemberStat, detail: string) =>
    titles.push({ id, emoji, title, uid: stat.uid, name: stat.name, detail });

  const mvp = best(stats, (stat) => stat.week);
  if (mvp && mvp.week > 0) {
    add('mvp', '🥇', 'MVP de la semana', mvp, `${mvp.week} esta semana`);
  }

  // Remontada: solo entre quienes publican la semana anterior.
  const comeback = best(
    stats.filter((stat) => stat.prevWeek !== null),
    (stat) => stat.week - (stat.prevWeek ?? 0)
  );
  if (comeback && comeback.week - (comeback.prevWeek ?? 0) > 0) {
    add('remontada', '📈', 'Remontada', comeback, `+${comeback.week - (comeback.prevWeek ?? 0)} respecto a la semana pasada`);
  }

  const streak = best(stats, (stat) => stat.streak ?? 0);
  if (streak && (streak.streak ?? 0) >= 2) {
    add('constante', '🔥', 'El más constante', streak, `${streak.streak} días seguidos`);
  }

  const idle = best(stats, (stat) => stat.idleDays ?? -1);
  if (idle && (idle.idleDays ?? 0) >= 3) {
    add('desaparecido', '💤', 'Desaparecido', idle, `${idle.idleDays} días sin aparecer`);
  }

  // Farolillo rojo: el último de la semana, y solo si de verdad hay clasificación.
  if (stats.length >= 2 && mvp && mvp.week > 0) {
    const last = best(stats, (stat) => -stat.week);
    if (last && last.uid !== mvp.uid) {
      add('farolillo', '🐢', 'Farolillo rojo', last, last.week === 0 ? 'sin estrenar esta semana' : `${last.week} esta semana`);
    }
  }
  return titles;
}

// El mejor según `value`; con empate gana quien más lleve en total, y si sigue el empate, el
// primero por nombre (así el resultado no depende del orden de los miembros).
function best(stats: MemberStat[], value: (stat: MemberStat) => number): MemberStat | null {
  return stats.reduce<MemberStat | null>((top, stat) => {
    if (!top) {
      return stat;
    }
    const diff = value(stat) - value(top);
    if (diff > 0) {
      return stat;
    }
    if (diff < 0) {
      return top;
    }
    return stat.total > top.total || (stat.total === top.total && stat.name.localeCompare(top.name) < 0) ? stat : top;
  }, null);
}

// ---------------------------------------------------------------- objetivo colectivo

export function goalProgress(group: Group, now: Date): GoalProgress | null {
  const goal = group.goal;
  if (!goal || goal.target <= 0) {
    return null;
  }
  const stats = memberStats(group, now);
  const current = stats.reduce((sum, stat) => sum + (goal.period === 'semana' ? stat.week : stat.month), 0);
  return {
    period: goal.period,
    target: goal.target,
    current,
    percent: Math.min(100, (current / goal.target) * 100),
    done: current >= goal.target,
  };
}

// ---------------------------------------------------------------- resumen semanal

export interface WeekSummary {
  groupName: string;
  weekLabel: string;
  total: number;
  champion: { name: string; value: number } | null;
  titles: Title[];
  ranking: { name: string; value: number }[];
}

export function weekSummary(group: Group, now: Date): WeekSummary {
  const stats = memberStats(group, now).sort((a, b) => b.week - a.week || a.name.localeCompare(b.name));
  const champion = stats[0] && stats[0].week > 0 ? { name: stats[0].name, value: stats[0].week } : null;
  return {
    groupName: group.name,
    weekLabel: `Semana del ${format(parseISO(weekKey(now)), "d 'de' MMMM", { locale: es })}`,
    total: stats.reduce((sum, stat) => sum + stat.week, 0),
    champion,
    titles: weeklyTitles(group, now),
    ranking: stats.slice(0, 5).map((stat) => ({ name: stat.name, value: stat.week })),
  };
}
