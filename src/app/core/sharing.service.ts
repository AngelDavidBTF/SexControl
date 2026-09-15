import { Injectable, inject } from '@angular/core';
import { Firestore, doc, updateDoc, writeBatch } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { unlockedCount } from '../shared/achievements';
import { FapStats } from '../shared/fap.model';
import { PeriodCount, PrivacyLevel, SocialEntry } from '../shared/friend.model';
import { GroupMember } from '../shared/group.model';
import {
  currentMonthTotals,
  currentWeekTotals,
  lastActiveDayKey,
  monthKey,
  previousMonthKey,
  previousMonthTotals,
  previousWeekKey,
  previousWeekTotals,
  streaks,
  weekKey,
} from '../shared/stats';
import { FriendsService } from './friends.service';
import { GroupsService } from './groups.service';

// Máximo de escrituras por batch de Firestore (500), con margen.
const BATCH_SIZE = 450;

export interface ProfileChange {
  displayName: string | null;
  photoURL: string | null;
}

type Shared = Pick<
  SocialEntry,
  'solitario' | 'compania' | 'total' | 'hidden' | 'week' | 'month' | 'streak' | 'lastDay' | 'badges' | 'prevWeek' | 'prevMonth'
>;

// Lo que se calcula una sola vez por publicación y se reparte a amigos y grupos.
interface Snapshot {
  total: number;
  week: PeriodCount;
  month: PeriodCount;
  prevWeek: PeriodCount;
  prevMonth: PeriodCount;
  streak: number;
  lastDay: string | null;
  badges: number;
}

// Publica mis totales (y opcionalmente mi perfil) en social/{amigo} y en mis grupos, respetando
// lo que cada amigo puede ver y la pausa global. Escribe valores absolutos: cualquier copia
// desfasada se corrige en la siguiente publicación. Amigos y grupos salen de los listeners de la
// sesión, así que normalmente no cuesta lecturas. Nunca lanza.
@Injectable({
  providedIn: 'root',
})
export class SharingService {
  private firestore = inject(Firestore);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);

  async publish(uid: string, stats: FapStats, options: { onlyFriend?: string; profile?: ProfileChange } = {}): Promise<void> {
    try {
      const [social, groups] = await Promise.all([
        firstValueFrom(this.friendsService.social$(uid)),
        firstValueFrom(this.groupsService.groupsForUser$(uid)),
      ]);
      const now = new Date();
      const week = currentWeekTotals(stats.days, now);
      const month = currentMonthTotals(stats.days, now);
      const prevWeek = previousWeekTotals(stats.days, now);
      const prevMonth = previousMonthTotals(stats.days, now);
      const snapshot: Snapshot = {
        total: stats.solitario + stats.compania,
        week: { key: weekKey(now), s: week.solitario, c: week.compania },
        month: { key: monthKey(now), s: month.solitario, c: month.compania },
        prevWeek: { key: previousWeekKey(now), s: prevWeek.solitario, c: prevWeek.compania },
        prevMonth: { key: previousMonthKey(now), s: prevMonth.solitario, c: prevMonth.compania },
        streak: streaks(stats.days, now).current,
        lastDay: lastActiveDayKey(stats.days),
        badges: unlockedCount({ stats, friends: social.friends.length, groups: groups.length, today: now }),
      };
      const profile = options.profile ?? {};

      // Amigos: mi entrada en su documento no la puedo leer, así que se escribe siempre (las
      // reglas aceptan que el valor no cambie).
      const friends = social.friends.filter((f) => !options.onlyFriend || f.uid === options.onlyFriend);
      for (let i = 0; i < friends.length; i += BATCH_SIZE) {
        const batch = writeBatch(this.firestore);
        for (const friend of friends.slice(i, i + BATCH_SIZE)) {
          const level: PrivacyLevel = social.paused ? 'nada' : (social.privacy[friend.uid] ?? 'todo');
          const entry = { ...friendShare(level, stats, snapshot), ...profile };
          batch.set(doc(this.firestore, 'social', friend.uid), { friends: { [uid]: entry } }, { merge: true });
        }
        await batch.commit();
      }

      if (options.onlyFriend) {
        return;
      }

      // Grupos: mi entrada sí está en memoria, así que solo se escriben los que cambian. Uno a
      // uno, para que un grupo del que acaban de sacarme no impida actualizar los demás.
      const share = groupShare(social.paused, stats, snapshot);
      const next = { ...share, ...profile };
      const outdated = groups.filter((group) => group.id && !sameEntry(group.members?.[uid], next));
      await Promise.allSettled(
        outdated.map((group) =>
          updateDoc(
            doc(this.firestore, 'groups', group.id!),
            Object.fromEntries(Object.entries(next).map(([field, value]) => [`members.${uid}.${field}`, value]))
          )
        )
      );
    } catch (error) {
      console.warn('No se pudieron publicar los datos a amigos y grupos', error);
    }
  }
}

// Con "nada" no se comparte nada; con "solo el total", ni periodos ni actividad (el último día
// o la racha delatarían cuándo se suma). Los duelos ganados sí, porque son cosa de los dos.
const NOTHING: Shared = {
  solitario: null,
  compania: null,
  total: null,
  week: null,
  month: null,
  prevWeek: null,
  prevMonth: null,
  streak: null,
  lastDay: null,
  badges: null,
  hidden: true,
};

function friendShare(level: PrivacyLevel, stats: FapStats, snapshot: Snapshot): Shared {
  switch (level) {
    case 'nada':
      return NOTHING;
    case 'total':
      return { ...NOTHING, total: snapshot.total, hidden: false };
    default:
      return {
        solitario: stats.solitario,
        compania: stats.compania,
        total: snapshot.total,
        week: snapshot.week,
        month: snapshot.month,
        prevWeek: snapshot.prevWeek,
        prevMonth: snapshot.prevMonth,
        streak: snapshot.streak,
        lastDay: snapshot.lastDay,
        badges: snapshot.badges,
        hidden: false,
      };
  }
}

function groupShare(paused: boolean, stats: FapStats, snapshot: Snapshot): Omit<GroupMember, 'displayName' | 'photoURL'> {
  return paused
    ? { solitario: 0, compania: 0, week: null, month: null, prevWeek: null, prevMonth: null, streak: null, lastDay: null, badges: null, hidden: true }
    : {
        solitario: stats.solitario,
        compania: stats.compania,
        week: snapshot.week,
        month: snapshot.month,
        prevWeek: snapshot.prevWeek,
        prevMonth: snapshot.prevMonth,
        streak: snapshot.streak,
        lastDay: snapshot.lastDay,
        badges: snapshot.badges,
        hidden: false,
      };
}

function sameEntry(current: Partial<GroupMember> | undefined, next: Record<string, unknown>): boolean {
  if (!current) {
    return false;
  }
  return Object.entries(next).every(([field, value]) => JSON.stringify((current as Record<string, unknown>)[field] ?? null) === JSON.stringify(value ?? null));
}
