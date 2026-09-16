import { differenceInCalendarDays } from 'date-fns';
import { FapStats } from './fap.model';
import { anyWeekReached, bucketTotal, firstActiveDay, recordDay, streaks, timeSlotTotals, weekdayTotals } from './stats';

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  // 0..1 para mostrar lo que falta en los bloqueados.
  progress: number;
}

export interface AchievementContext {
  stats: FapStats;
  friends: number;
  groups: number;
  today: Date;
  // Logros sociales (S5): duelos ganados y temporadas de grupo ganadas. Salen de datos que ya
  // están cargados (social/{uid} y los grupos), así que no cuestan lecturas.
  wins?: number;
  championships?: number;
}

interface Definition {
  id: string;
  emoji: string;
  title: string;
  description: string;
  // Valor actual y objetivo: desbloqueado cuando value >= target.
  measure: (ctx: AchievementContext) => [number, number];
}

const DEFINITIONS: Definition[] = [
  { id: 'primera', emoji: '🎉', title: 'La primera', description: 'Registra la primera', measure: (c) => [total(c), 1] },
  { id: 'diez', emoji: '🔟', title: 'Diez', description: 'Llega a 10 en total', measure: (c) => [total(c), 10] },
  { id: 'cien', emoji: '💯', title: 'Centenario', description: 'Llega a 100 en total', measure: (c) => [total(c), 100] },
  { id: 'quinientos', emoji: '🏅', title: 'Leyenda', description: 'Llega a 500 en total', measure: (c) => [total(c), 500] },
  { id: 'racha3', emoji: '🔥', title: 'En racha', description: '3 días seguidos', measure: (c) => [streaks(c.stats.days, c.today).best, 3] },
  { id: 'racha7', emoji: '🔥', title: 'Semana perfecta', description: '7 días seguidos', measure: (c) => [streaks(c.stats.days, c.today).best, 7] },
  { id: 'racha30', emoji: '🌋', title: 'Imparable', description: '30 días seguidos', measure: (c) => [streaks(c.stats.days, c.today).best, 30] },
  { id: 'triple', emoji: '⚡', title: 'Día épico', description: '3 en un mismo día', measure: (c) => [recordDay(c.stats.days)?.total ?? 0, 3] },
  { id: 'noctambulo', emoji: '🌙', title: 'Noctámbulo', description: '10 de madrugada (0:00-6:00)', measure: (c) => [timeSlotTotals(c.stats.hours)[0], 10] },
  { id: 'madrugador', emoji: '☀️', title: 'Buenos días', description: '10 por la mañana (6:00-12:00)', measure: (c) => [timeSlotTotals(c.stats.hours)[1], 10] },
  {
    id: 'semana-completa',
    emoji: '🗓️',
    title: 'Todos los días',
    description: 'Al menos una cada día de la semana (en tu historial)',
    measure: (c) => [weekdayTotals(c.stats.days).filter((b) => bucketTotal(b) > 0).length, 7],
  },
  {
    id: 'objetivo',
    emoji: '🎯',
    title: 'Objetivo cumplido',
    description: 'Cumple tu objetivo semanal alguna semana',
    measure: (c) => {
      const goal = c.stats.goals.semana;
      return [goal && anyWeekReached(c.stats.days, goal) ? 1 : 0, 1];
    },
  },
  { id: 'social', emoji: '🤝', title: 'Social', description: 'Ten 5 amigos', measure: (c) => [c.friends, 5] },
  { id: 'grupo', emoji: '👥', title: 'En grupo', description: 'Forma parte de un grupo', measure: (c) => [c.groups, 1] },
  { id: 'duelista', emoji: '⚔️', title: 'Duelista', description: 'Gana tu primer duelo', measure: (c) => [c.wins ?? 0, 1] },
  { id: 'invicto', emoji: '🛡️', title: 'Invicto', description: 'Gana 5 duelos', measure: (c) => [c.wins ?? 0, 5] },
  { id: 'campeon', emoji: '👑', title: 'Campeón', description: 'Gana el mes en un grupo', measure: (c) => [c.championships ?? 0, 1] },
  {
    id: 'tricampeon',
    emoji: '🏆',
    title: 'Tricampeón',
    description: 'Gana el mes tres veces',
    measure: (c) => [c.championships ?? 0, 3],
  },
  {
    id: 'aniversario',
    emoji: '🎂',
    title: 'Un año',
    description: 'Un año desde tu primer registro',
    measure: (c) => {
      const first = firstActiveDay(c.stats.days);
      return [first ? differenceInCalendarDays(c.today, first) : 0, 365];
    },
  },
];

function total(ctx: AchievementContext): number {
  return ctx.stats.solitario + ctx.stats.compania;
}

// Cuántos logros lleva desbloqueados (se publica a amigos y grupos para la ficha y los títulos).
export function unlockedCount(ctx: AchievementContext): number {
  return achievements(ctx).filter((achievement) => achievement.unlocked).length;
}

// Se calculan en el dispositivo a partir de datos que ya están cargados: no cuestan lecturas.
export function achievements(ctx: AchievementContext): Achievement[] {
  return DEFINITIONS.map((definition) => {
    const [value, target] = definition.measure(ctx);
    return {
      id: definition.id,
      emoji: definition.emoji,
      title: definition.title,
      description: definition.description,
      unlocked: value >= target,
      progress: Math.max(0, Math.min(1, value / target)),
    };
  });
}

