import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Subscription, combineLatest, firstValueFrom, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { GroupsService } from '../../core/groups.service';
import { ProfileService } from '../../core/profile.service';
import { FriendsService, SEARCH_MIN_CHARS } from '../../core/friends.service';
import { UiService } from '../../core/ui.service';
import { UsernamePromptService } from '../../core/username-prompt.service';
import { HeaderComponent } from '../../components/header/header.component';
import { ShareInviteModal } from '../../components/share-invite/share-invite.modal';
import { Group } from '../../shared/group.model';
import { User } from '../../shared/user.model';

// Como mucho, cuántas personas de tus grupos se sugieren antes de escribir nada.
const GROUP_SUGGESTIONS = 8;

// Buscar amigos: sugerencias mientras se escribe (nombre o @usuario, de quien aparece en
// búsquedas), gente de tus grupos antes de escribir, y el enlace para quien ya está en WhatsApp.
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
  private groupsService = inject(GroupsService);
  private ui = inject(UiService);
  private profiles = inject(ProfileService);
  private usernamePrompt = inject(UsernamePromptService);
  private modalController = inject(ModalController);

  textoBuscar = '';
  buscando = false;
  // Se ha terminado una búsqueda (para decir "no hay nadie").
  buscado = false;
  // Mi @usuario, para dárselo a los amigos.
  miUsuario: string | null = null;
  // Uids a los que ya he mandado solicitud desde esta pantalla (el botón cambia al momento).
  enviados = new Set<string>();

  private resultados: User[] = [];
  private deGrupos: User[] = [];
  // Yo, mis amigos, solicitudes en cualquier sentido y bloqueados: nunca se sugieren.
  private excluded = new Set<string>();
  private subs = new Subscription();
  private searchSeq = 0;

  get escribiendo(): boolean {
    return this.textoBuscar.trim().replace(/^@+/, '').length >= SEARCH_MIN_CHARS;
  }

  get sugerencias(): User[] {
    return this.resultados.filter((user) => !this.excluded.has(user.uid) || this.enviados.has(user.uid));
  }

  get genteDeGrupos(): User[] {
    return this.deGrupos.filter((user) => !this.excluded.has(user.uid) || this.enviados.has(user.uid));
  }

  ngOnInit(): void {
    this.subs.add(
      this.authService.user$
        .pipe(
          switchMap((user) =>
            user ? combineLatest([this.friendsService.social$(user.uid), this.groupsService.groupsForUser$(user.uid)]) : of(null)
          )
        )
        .subscribe((data) => {
          const uid = this.authService.currentUid();
          if (!data || !uid) {
            return;
          }
          const [social, groups] = data;
          this.excluded = new Set([uid, ...[...social.friends, ...social.sent, ...social.requests, ...social.blocked].map((entry) => entry.uid)]);
          this.deGrupos = groupMembers(groups, uid);
        })
    );
    this.subs.add(
      this.authService.user$
        .pipe(switchMap((user) => (user ? this.profiles.profile$(user.uid) : of(null))))
        .subscribe((profile) => (this.miUsuario = profile?.username ?? null))
    );
  }

  async onSearchChange(event: CustomEvent): Promise<void> {
    this.textoBuscar = event.detail.value ?? '';
    const seq = ++this.searchSeq;
    this.buscado = false;

    if (!this.escribiendo) {
      this.resultados = [];
      this.buscando = false;
      return;
    }

    this.buscando = true;
    try {
      const users = await this.friendsService.searchPeople(this.textoBuscar, new Set());
      // Descarta respuestas de búsquedas anteriores que lleguen tarde.
      if (seq === this.searchSeq) {
        this.resultados = users;
        this.buscado = true;
      }
    } catch (error) {
      console.error('Error buscando personas', error);
      if (seq === this.searchSeq) {
        this.resultados = [];
      }
      await this.ui.toast('No se pudo realizar la búsqueda');
    } finally {
      if (seq === this.searchSeq) {
        this.buscando = false;
      }
    }
  }

  async enviarPeticion(user: User): Promise<void> {
    const me = this.authService.currentUser();
    if (!me || this.enviados.has(user.uid)) {
      return;
    }
    this.enviados = new Set(this.enviados).add(user.uid);
    try {
      const [profile, myCounts] = await Promise.all([this.profiles.current(me.uid), firstValueFrom(this.fapService.fapCounts$(me.uid))]);
      await this.friendsService.sendRequest(profile, myCounts, user);
      await this.ui.toast(`Solicitud enviada a ${user.displayName || '@' + user.username}`);
    } catch (error) {
      console.error('Error enviando solicitud', error);
      const rest = new Set(this.enviados);
      rest.delete(user.uid);
      this.enviados = rest;
      await this.ui.toast('No se pudo enviar la solicitud');
    }
  }

  async elegirUsuario(): Promise<void> {
    const uid = this.authService.currentUid();
    if (uid) {
      await this.usernamePrompt.choose(uid);
    }
  }

  async invitar(): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    const modal = await this.modalController.create({
      component: ShareInviteModal,
      componentProps: {
        url: `${location.origin}/invitar/${uid}`,
        title: 'Invitar a un amigo',
        subtitle: 'Quien abra el enlace o escanee el QR podrá mandarte una solicitud de amistad.',
        warning: 'El enlace solo sirve para pedirte amistad: nadie ve tus números hasta que aceptas.',
      },
    });
    await modal.present();
  }

  trackByUid(_: number, user: User): string {
    return user.uid;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}

// Gente de mis grupos, sin repetir y empezando por quien comparte más grupos conmigo. Sale de los
// documentos de grupo, que ya traen nombre y foto de cada miembro.
function groupMembers(groups: Group[], myUid: string): User[] {
  const seen = new Map<string, { user: User; shared: number }>();
  for (const group of groups) {
    for (const uid of group.memberUids) {
      if (uid === myUid) {
        continue;
      }
      const member = group.members?.[uid];
      const entry = seen.get(uid) ?? {
        user: { uid, email: null, displayName: member?.displayName ?? null, photoURL: member?.photoURL ?? null },
        shared: 0,
      };
      entry.shared++;
      seen.set(uid, entry);
    }
  }
  return [...seen.values()]
    .sort((a, b) => b.shared - a.shared || (a.user.displayName ?? '').localeCompare(b.user.displayName ?? ''))
    .slice(0, GROUP_SUGGESTIONS * 3)
    .map((entry) => entry.user);
}
