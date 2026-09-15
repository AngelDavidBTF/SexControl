import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionSheetController, AlertController, IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { Observable, firstValueFrom, map, of, shareReplay, switchMap } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { FriendsService } from '../../core/friends.service';
import { GroupsService } from '../../core/groups.service';
import { SharingService } from '../../core/sharing.service';
import { UiService } from '../../core/ui.service';
import { DatoDirective } from '../../shared/dato.directive';
import { Friend, PRIVACY_LABELS, PrivacyLevel, REACTION_EMOJIS, ReceivedReaction, Social } from '../../shared/friend.model';
import { Group } from '../../shared/group.model';
import { FiltroPipe } from '../../shared/filtro.pipe';

function total(friend: Friend): number {
  if (friend.hidden) {
    return -1;
  }
  return friend.total ?? (friend.solitario ?? 0) + (friend.compania ?? 0);
}

const EMPTY_SOCIAL: Social = { friends: [], requests: [], sent: [], reactions: [], privacy: {}, paused: false };

@Component({
  selector: 'app-amigos',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, FiltroPipe, DatoDirective],
  templateUrl: './amigos.page.html',
  styleUrl: './amigos.page.scss',
})
export class AmigosPage {
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);
  private sharing = inject(SharingService);
  private ui = inject(UiService);
  private actionSheetController = inject(ActionSheetController);
  private alertController = inject(AlertController);

  segment: 'amigos' | 'grupos' = 'amigos';
  textoBuscar = '';
  private privacy: Record<string, PrivacyLevel> = {};

  // Todo sale de social/{uid}: 1 lectura para amigos, totales, solicitudes y reacciones.
  private readonly social$: Observable<Social> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.social$(user.uid) : of(EMPTY_SOCIAL))),
    map((social) => {
      this.privacy = social.privacy;
      return social;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // Amigos ordenados de más a menos faps totales; los que no comparten, al final.
  readonly friends$: Observable<Friend[]> = this.social$.pipe(
    map((social) => [...social.friends].sort((a, b) => total(b) - total(a)))
  );

  readonly pendingRequests$: Observable<number> = this.social$.pipe(map((social) => social.requests.length));
  readonly reactions$: Observable<ReceivedReaction[]> = this.social$.pipe(map((social) => social.reactions));

  // Solo se consulta al abrir el segmento Grupos (la plantilla se suscribe dentro de él).
  readonly groups$: Observable<Group[]> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.groupsService.groupsForUser$(user.uid) : of([]))),
    map((groups) => [...groups].sort((a, b) => a.name.localeCompare(b.name)))
  );

  shareMode(friend: Friend): 'hidden' | 'total' | 'todo' {
    if (friend.hidden) {
      return 'hidden';
    }
    return friend.solitario == null && friend.compania == null && friend.total != null ? 'total' : 'todo';
  }

  privacyFor(uid: string): PrivacyLevel {
    return this.privacy[uid] ?? 'todo';
  }

  timeAgo(at: Timestamp | null): string {
    return at ? formatDistanceToNow(at.toDate(), { addSuffix: true, locale: es }) : '';
  }

  // Las actualizaciones en vivo crean objetos nuevos: trackBy evita recrear todas las filas.
  trackByUid(_: number, item: { uid: string }): string {
    return item.uid;
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

  // ---------------------------------------------------------------- acciones sobre un amigo

  async friendActions(friend: Friend): Promise<void> {
    const name = friend.displayName || friend.email || 'tu amigo';
    const sheet = await this.actionSheetController.create({
      header: name,
      buttons: [
        { text: 'Mandar una reacción', icon: 'happy-outline', data: 'react' },
        { text: `Qué ve de ti: ${PRIVACY_LABELS[this.privacyFor(friend.uid)].toLowerCase()}`, icon: 'eye-outline', data: 'privacy' },
        { text: 'Eliminar amistad', icon: 'person-remove-outline', role: 'destructive', data: 'remove' },
        { text: 'Cancelar', role: 'cancel', icon: 'close' },
      ],
    });
    await sheet.present();
    const { data } = await sheet.onDidDismiss<string>();
    if (data === 'react') {
      await this.chooseReaction(friend, name);
    } else if (data === 'privacy') {
      await this.choosePrivacy(friend, name);
    } else if (data === 'remove') {
      await this.confirmRemove(friend, name);
    }
  }

  private async chooseReaction(friend: Friend, name: string): Promise<void> {
    const sheet = await this.actionSheetController.create({
      header: `Reaccionar a ${name}`,
      buttons: [...REACTION_EMOJIS.map((emoji) => ({ text: emoji, data: emoji })), { text: 'Cancelar', role: 'cancel' }],
    });
    await sheet.present();
    const { data: emoji } = await sheet.onDidDismiss<string>();
    const uid = this.authService.currentUid();
    if (!emoji || !uid) {
      return;
    }
    try {
      await this.friendsService.sendReaction(uid, friend.uid, emoji);
      await this.ui.toast(`Le has mandado ${emoji} a ${name}`);
    } catch (error) {
      console.error('Error enviando reacción', error);
      await this.ui.toast('No se pudo enviar la reacción');
    }
  }

  private async choosePrivacy(friend: Friend, name: string): Promise<void> {
    const current = this.privacyFor(friend.uid);
    const alert = await this.alertController.create({
      header: `¿Qué ve ${name} de ti?`,
      inputs: (Object.keys(PRIVACY_LABELS) as PrivacyLevel[]).map((level) => ({
        type: 'radio' as const,
        label: PRIVACY_LABELS[level],
        value: level,
        checked: level === current,
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { data, role } = await alert.onDidDismiss<{ values: PrivacyLevel }>();
    const uid = this.authService.currentUid();
    const level = data?.values;
    if (role !== 'confirm' || !level || level === current || !uid) {
      return;
    }
    try {
      await this.friendsService.setPrivacy(uid, friend.uid, level);
      const stats = await firstValueFrom(this.fapService.stats$(uid));
      await this.sharing.publish(uid, stats, { onlyFriend: friend.uid });
      await this.ui.toast('Privacidad actualizada');
    } catch (error) {
      console.error('Error cambiando privacidad', error);
      await this.ui.toast('No se pudo cambiar la privacidad');
    }
  }

  private async confirmRemove(friend: Friend, name: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar amistad',
      message: `${name} dejará de ver tus números y tú los suyos. Los grupos que compartáis no cambian.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    const uid = this.authService.currentUid();
    if (role !== 'destructive' || !uid) {
      return;
    }
    try {
      await this.friendsService.removeFriend(uid, friend.uid);
      await this.ui.toast(`${name} ya no está en tus amigos`);
    } catch (error) {
      console.error('Error eliminando amistad', error);
      await this.ui.toast('No se pudo eliminar la amistad');
    }
  }

  async clearReactions(): Promise<void> {
    const uid = this.authService.currentUid();
    if (uid) {
      await this.friendsService.clearReactions(uid);
    }
  }
}
