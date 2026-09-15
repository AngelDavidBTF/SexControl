import { Injectable, inject } from '@angular/core';
import { Firestore, doc, updateDoc, writeBatch } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { FapStats } from '../shared/fap.model';
import { PeriodCount, PrivacyLevel, SocialEntry } from '../shared/friend.model';
import { GroupMember } from '../shared/group.model';
import { currentMonthTotals, currentWeekTotals, monthKey, weekKey } from '../shared/stats';
import { FriendsService } from './friends.service';
import { GroupsService } from './groups.service';

// Máximo de escrituras por batch de Firestore (500), con margen.
const BATCH_SIZE = 450;

export interface ProfileChange {
  displayName: string | null;
  photoURL: string | null;
}

type Shared = Pick<SocialEntry, 'solitario' | 'compania' | 'total' | 'hidden' | 'week' | 'month'>;

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
      const weekCount: PeriodCount = { key: weekKey(now), s: week.solitario, c: week.compania };
      const monthCount: PeriodCount = { key: monthKey(now), s: month.solitario, c: month.compania };
      const profile = options.profile ?? {};

      // Amigos: mi entrada en su documento no la puedo leer, así que se escribe siempre (las
      // reglas aceptan que el valor no cambie).
      const friends = social.friends.filter((f) => !options.onlyFriend || f.uid === options.onlyFriend);
      for (let i = 0; i < friends.length; i += BATCH_SIZE) {
        const batch = writeBatch(this.firestore);
        for (const friend of friends.slice(i, i + BATCH_SIZE)) {
          const level: PrivacyLevel = social.paused ? 'nada' : (social.privacy[friend.uid] ?? 'todo');
          const entry = { ...friendShare(level, stats, weekCount, monthCount), ...profile };
          batch.set(doc(this.firestore, 'social', friend.uid), { friends: { [uid]: entry } }, { merge: true });
        }
        await batch.commit();
      }

      if (options.onlyFriend) {
        return;
      }

      // Grupos: mi entrada sí está en memoria, así que solo se escriben los que cambian. Uno a
      // uno, para que un grupo del que acaban de sacarme no impida actualizar los demás.
      const share = groupShare(social.paused, stats, weekCount, monthCount);
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

function friendShare(level: PrivacyLevel, stats: FapStats, week: PeriodCount, month: PeriodCount): Shared {
  const total = stats.solitario + stats.compania;
  switch (level) {
    case 'nada':
      return { solitario: null, compania: null, total: null, week: null, month: null, hidden: true };
    case 'total':
      return { solitario: null, compania: null, total, week: null, month: null, hidden: false };
    default:
      return { solitario: stats.solitario, compania: stats.compania, total, week, month, hidden: false };
  }
}

function groupShare(paused: boolean, stats: FapStats, week: PeriodCount, month: PeriodCount): Omit<GroupMember, 'displayName' | 'photoURL'> {
  return paused
    ? { solitario: 0, compania: 0, week: null, month: null, hidden: true }
    : { solitario: stats.solitario, compania: stats.compania, week, month, hidden: false };
}

function sameEntry(current: Partial<GroupMember> | undefined, next: Record<string, unknown>): boolean {
  if (!current) {
    return false;
  }
  return Object.entries(next).every(([field, value]) => JSON.stringify((current as Record<string, unknown>)[field] ?? null) === JSON.stringify(value ?? null));
}
