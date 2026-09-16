import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, firstValueFrom, map } from 'rxjs';
import { Achievement, achievements } from '../shared/achievements';
import { FapService } from './fap.service';
import { FriendsService } from './friends.service';
import { GroupsService } from './groups.service';
import { UiService } from './ui.service';

function seenKey(uid: string): string {
  return `sexcontrol.achievements.${uid}`;
}

// Logros calculados en el dispositivo con datos ya cargados (fapStats, social y grupos).
@Injectable({
  providedIn: 'root',
})
export class AchievementsService {
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);
  private ui = inject(UiService);

  achievements$(uid: string): Observable<Achievement[]> {
    return combineLatest([
      this.fapService.stats$(uid),
      this.friendsService.social$(uid),
      this.groupsService.groupsForUser$(uid),
    ]).pipe(
      map(([stats, social, groups]) =>
        achievements({
          stats,
          friends: social.friends.length,
          groups: groups.length,
          today: new Date(),
          wins: social.wins,
          // Temporadas de grupo ganadas, contando todos sus grupos.
          championships: groups.reduce(
            (count, group) =>
              count + Object.values(group.seasons ?? {}).filter((season) => season.winnerUid === uid).length,
            0
          ),
        })
      )
    );
  }

  // Avisa de los logros desbloqueados desde la última comprobación. La primera vez en un
  // dispositivo solo los marca como vistos, para no soltar una ráfaga de avisos antiguos.
  async announceNew(uid: string): Promise<void> {
    try {
      const unlocked = (await firstValueFrom(this.achievements$(uid))).filter((a) => a.unlocked);
      const stored = readSeen(uid);
      writeSeen(uid, unlocked.map((a) => a.id));
      if (stored === null) {
        return;
      }
      for (const achievement of unlocked.filter((a) => !stored.includes(a.id))) {
        await this.ui.toast(`${achievement.emoji} ¡Logro desbloqueado: ${achievement.title}!`);
      }
    } catch (error) {
      console.warn('No se pudieron comprobar los logros', error);
    }
  }
}

function readSeen(uid: string): string[] | null {
  try {
    const raw = localStorage.getItem(seenKey(uid));
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

function writeSeen(uid: string, ids: string[]): void {
  try {
    localStorage.setItem(seenKey(uid), JSON.stringify(ids));
  } catch {
    // Sin almacenamiento local simplemente no se avisa.
  }
}
