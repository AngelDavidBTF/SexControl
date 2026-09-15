import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FriendsService } from '../../core/friends.service';
import { GroupsService } from '../../core/groups.service';
import { Friend, Social } from '../../shared/friend.model';
import { Group } from '../../shared/group.model';
import { FiltroPipe } from '../../shared/filtro.pipe';

function total(friend: Friend): number {
  return (friend.solitario ?? 0) + (friend.compania ?? 0);
}

const EMPTY_SOCIAL: Social = { friends: [], requests: [], sent: [] };

@Component({
  selector: 'app-amigos',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, FiltroPipe],
  templateUrl: './amigos.page.html',
})
export class AmigosPage {
  private authService = inject(AuthService);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);

  segment: 'amigos' | 'grupos' = 'amigos';
  textoBuscar = '';

  // Todo sale de social/{uid}: 1 lectura para amigos, totales y solicitudes.
  private readonly social$: Observable<Social> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.social$(user.uid) : of(EMPTY_SOCIAL)))
  );

  // Amigos ordenados de más a menos faps totales, igual que en la versión anterior.
  readonly friends$: Observable<Friend[]> = this.social$.pipe(
    map((social) => [...social.friends].sort((a, b) => total(b) - total(a)))
  );

  readonly pendingRequests$: Observable<number> = this.social$.pipe(map((social) => social.requests.length));

  // Solo se consulta al abrir el segmento Grupos (la plantilla se suscribe dentro de él).
  readonly groups$: Observable<Group[]> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.groupsService.groupsForUser$(user.uid) : of([]))),
    map((groups) => [...groups].sort((a, b) => a.name.localeCompare(b.name)))
  );

  // Las actualizaciones en vivo crean objetos nuevos: trackBy evita recrear todas las filas.
  trackByUid(_: number, friend: Friend): string {
    return friend.uid;
  }

  trackById(_: number, group: Group): string | undefined {
    return group.id;
  }

  onSegmentChange(event: CustomEvent): void {
    this.segment = event.detail.value;
    this.textoBuscar = '';
  }

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }
}
