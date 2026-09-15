import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription, combineLatest, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FriendsService } from '../../core/friends.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { User } from '../../shared/user.model';

@Component({
  selector: 'app-add-friend',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent],
  templateUrl: './add-friend.page.html',
  styleUrl: './add-friend.page.scss',
})
export class AddFriendPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private friendsService = inject(FriendsService);
  private ui = inject(UiService);

  textoBuscar = '';
  users: User[] = [];
  buscando = false;

  // Uids que no deben aparecer en la búsqueda: yo, mis amigos y solicitudes pendientes en cualquier sentido.
  private excluded = new Set<string>();
  private excludedSub?: Subscription;
  private searchSeq = 0;

  ngOnInit(): void {
    this.excludedSub = this.authService.user$
      .pipe(
        switchMap((user) =>
          user
            ? combineLatest([
                of(user.uid),
                this.friendsService.friends$(user.uid),
                this.friendsService.outgoingRequests$(user.uid),
                this.friendsService.incomingRequests$(user.uid),
              ])
            : of(null)
        )
      )
      .subscribe((data) => {
        if (!data) {
          this.excluded = new Set();
          return;
        }
        const [uid, friends, outgoing, incoming] = data;
        this.excluded = new Set([
          uid,
          ...friends.map((friend) => friend.uid),
          ...outgoing.map((request) => request.toUid),
          ...incoming.map((request) => request.fromUid),
        ]);
        this.users = this.users.filter((user) => !this.excluded.has(user.uid));
      });
  }

  async onSearchChange(event: CustomEvent): Promise<void> {
    this.textoBuscar = event.detail.value ?? '';
    const seq = ++this.searchSeq;

    if (!this.textoBuscar.trim()) {
      this.users = [];
      this.buscando = false;
      return;
    }

    this.buscando = true;
    try {
      const users = await this.friendsService.searchUsers(this.textoBuscar, this.excluded);
      // Descarta respuestas de búsquedas anteriores que lleguen tarde.
      if (seq === this.searchSeq) {
        this.users = users;
      }
    } catch (error) {
      console.error('Error buscando usuarios', error);
      await this.ui.toast('No se pudo realizar la búsqueda');
    } finally {
      if (seq === this.searchSeq) {
        this.buscando = false;
      }
    }
  }

  async enviarPeticion(user: User): Promise<void> {
    const me = this.authService.currentUser();
    if (!me) {
      return;
    }

    try {
      await this.friendsService.sendRequest(me, user.uid);
      this.users = this.users.filter((u) => u.uid !== user.uid);
      await this.ui.toast('Se ha enviado la petición correctamente');
    } catch (error) {
      console.error('Error enviando solicitud', error);
      await this.ui.toast('No se pudo enviar la petición');
    }
  }

  ngOnDestroy(): void {
    this.excludedSub?.unsubscribe();
  }
}
