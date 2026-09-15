import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FriendsService } from '../../core/friends.service';
import { FapCounts, Friend } from '../../shared/friend.model';
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
  private friendsService = inject(FriendsService);

  segment: 'amigos' | 'grupos' = 'amigos';
  textoBuscar = '';

  // Amigos ordenados de más a menos faps totales, igual que en la versión anterior.
  readonly friends$: Observable<FriendWithCounts[] | null> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.friends$(user.uid) : of([]))),
    switchMap((friends) => {
      if (friends.length === 0) {
        return of([]);
      }
      return combineLatest(
        friends.map((friend) =>
          this.friendsService.fapCounts$(friend.uid).pipe(
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

  onSegmentChange(event: CustomEvent): void {
    this.segment = event.detail.value;
    this.textoBuscar = '';
  }

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }
}
