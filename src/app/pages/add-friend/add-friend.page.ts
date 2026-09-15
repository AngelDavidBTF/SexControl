import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription, firstValueFrom, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { ProfileService } from '../../core/profile.service';
import { FriendsService, SEARCH_MIN_CHARS } from '../../core/friends.service';
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
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private ui = inject(UiService);
  private profiles = inject(ProfileService);

  readonly minChars = SEARCH_MIN_CHARS;
  textoBuscar = '';
  users: User[] = [];
  buscando = false;

  // Uids que no deben aparecer en la búsqueda: yo, mis amigos y solicitudes pendientes en
  // cualquier sentido. Sale de social/{uid}, que ya está en memoria si se viene de Amigos.
  private excluded = new Set<string>();
  private excludedSub?: Subscription;
  private searchSeq = 0;

  ngOnInit(): void {
    this.excludedSub = this.authService.user$
      .pipe(switchMap((user) => (user ? this.friendsService.social$(user.uid) : of(null))))
      .subscribe((social) => {
        const uid = this.authService.currentUid();
        this.excluded = new Set(
          social && uid
            ? [uid, ...[...social.friends, ...social.sent, ...social.requests].map((entry) => entry.uid)]
            : []
        );
        this.users = this.users.filter((user) => !this.excluded.has(user.uid));
      });
  }

  get tooShort(): boolean {
    return this.textoBuscar.trim().length < SEARCH_MIN_CHARS;
  }

  async onSearchChange(event: CustomEvent): Promise<void> {
    this.textoBuscar = event.detail.value ?? '';
    const seq = ++this.searchSeq;

    if (this.tooShort) {
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
      const [profile, myCounts] = await Promise.all([this.profiles.current(me.uid), firstValueFrom(this.fapService.fapCounts$(me.uid))]);
      await this.friendsService.sendRequest(profile, myCounts, user);
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
