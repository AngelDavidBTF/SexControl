import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { FriendsService } from '../../core/friends.service';
import { GroupsService } from '../../core/groups.service';
import { FapCounts } from '../../shared/fap.model';
import { Friend } from '../../shared/friend.model';
import { Group } from '../../shared/group.model';
import { FiltroPipe } from '../../shared/filtro.pipe';

export interface FriendWithCounts extends Friend {
  counts: FapCounts | null;
}

function total(friend: FriendWithCounts): number {
  return (friend.counts?.solitario ?? 0) + (friend.counts?.compania ?? 0);
}

@Component({
  selector: 'app-amigos',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, FiltroPipe],
  templateUrl: './amigos.page.html',
})
export class AmigosPage {
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);

  segment: 'amigos' | 'grupos' = 'amigos';
  textoBuscar = '';

  // Amigos ordenados de más a menos faps totales, igual que en la versión anterior.
  readonly friends$: Observable<FriendWithCounts[]> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.friends$(user.uid) : of([]))),
    switchMap((friends) => {
      if (friends.length === 0) {
        return of([]);
      }
      return combineLatest(
        friends.map((friend) =>
          this.fapService.fapCounts$(friend.uid).pipe(
            // Sin permiso de lectura (p. ej. amistad recién eliminada) se muestra el amigo sin conteos.
            catchError(() => of(null)),
            map((counts): FriendWithCounts => ({ ...friend, counts }))
          )
        )
      ).pipe(map((list) => [...list].sort((a, b) => total(b) - total(a))));
    })
  );

  readonly pendingRequests$: Observable<number> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.incomingRequests$(user.uid) : of([]))),
    map((requests) => requests.length)
  );

  readonly groups$: Observable<Group[]> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.groupsService.groupsForUser$(user.uid) : of([]))),
    map((groups) => [...groups].sort((a, b) => a.name.localeCompare(b.name)))
  );

  onSegmentChange(event: CustomEvent): void {
    this.segment = event.detail.value;
    this.textoBuscar = '';
  }

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }
}
