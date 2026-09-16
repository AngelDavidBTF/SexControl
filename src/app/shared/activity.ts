import { Friend } from './friend.model';
import { MyEntry, periodValue } from './social';

// Actividad reciente de los amigos. Se deduce comparando lo que llega ahora con una foto de la
// última visita guardada en el propio dispositivo: ni escrituras ni lecturas extra.

export interface ActivitySnapshot {
  // uid → lo que vi la última vez.
  [uid: string]: { week: number; badges: number; streak: number };
}

export interface ActivityEvent {
  uid: string;
  emoji: string;
  text: string;
  // Texto para el modo discreto (sin números ni detalles).
  discreto: string;
}

const MAX_EVENTS = 6;

export function takeSnapshot(friends: Friend[], today: Date): ActivitySnapshot {
  const snapshot: ActivitySnapshot = {};
  for (const friend of friends) {
    snapshot[friend.uid] = {
      week: periodValue(friend, 'semana', today) ?? 0,
      badges: friend.badges ?? 0,
      streak: friend.streak ?? 0,
    };
  }
  return snapshot;
}

// Qué ha pasado desde la última visita. Sin foto previa (primera vez en este dispositivo) no se
// inventa nada: se devuelve la lista vacía y se guarda la foto.
export function activityEvents(previous: ActivitySnapshot | null, me: MyEntry, friends: Friend[], today: Date): ActivityEvent[] {
  if (!previous) {
    return [];
  }
  const myWeek = periodValue(me, 'semana', today) ?? 0;
  const events: ActivityEvent[] = [];

  for (const friend of friends) {
    const before = previous[friend.uid];
    if (!before) {
      continue;
    }
    const name = friend.displayName || friend.email || 'Un amigo';
    const week = periodValue(friend, 'semana', today);
    const badges = friend.badges ?? 0;
    const streak = friend.streak ?? 0;

    if (badges > before.badges) {
      const count = badges - before.badges;
      events.push({
        uid: friend.uid,
        emoji: '🏅',
        text: count === 1 ? `${name} ha desbloqueado un logro` : `${name} ha desbloqueado ${count} logros`,
        discreto: `${name} ha desbloqueado un logro`,
      });
    }
    if (week !== null && week > before.week) {
      // Adelantarme solo se cuenta si antes iba por detrás de mí y ahora no.
      if (before.week <= myWeek && week > myWeek) {
        events.push({ uid: friend.uid, emoji: '🏃', text: `${name} te ha adelantado esta semana`, discreto: `${name} te ha adelantado` });
      } else {
        const diff = week - before.week;
        events.push({
          uid: friend.uid,
          emoji: '✨',
          text: diff === 1 ? `${name} ha sumado una` : `${name} ha sumado ${diff}`,
          discreto: `${name} ha apuntado algo`,
        });
      }
    }
    if (streak >= 3 && streak > before.streak) {
      events.push({ uid: friend.uid, emoji: '🔥', text: `${name} lleva ${streak} días de racha`, discreto: `${name} lleva una buena racha` });
    }
  }
  return events.slice(0, MAX_EVENTS);
}
