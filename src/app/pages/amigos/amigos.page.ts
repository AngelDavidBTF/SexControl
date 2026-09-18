import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionSheetController, AlertController, IonicModule, ModalController } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { Observable, combineLatest, firstValueFrom, map, of, shareReplay, switchMap } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnalyticsService } from '../../core/analytics.service';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { FriendsService } from '../../core/friends.service';
import { GroupsService } from '../../core/groups.service';
import { ProfileService } from '../../core/profile.service';
import { SettingsService } from '../../core/settings.service';
import { SharingService } from '../../core/sharing.service';
import { UiService } from '../../core/ui.service';
import { FriendAction, FriendDetailModal } from '../../components/friend-detail/friend-detail.modal';
import { FriendsLeagueComponent } from '../../components/friends-league/friends-league.component';
import { MarcaComponent } from '../../components/ui/marca.component';
import { ShareInviteModal } from '../../components/share-invite/share-invite.modal';
import { DatoDirective } from '../../shared/dato.directive';
import {
  CHALLENGE_TARGETS,
  Challenge,
  ChallengeKind,
  DuelRecord,
  Friend,
  FriendChallenge,
  POKE_MESSAGES,
  PRIVACY_LABELS,
  PrivacyLevel,
  REACTION_EMOJIS,
  ReceivedPoke,
  Social,
} from '../../shared/friend.model';
import { activeChallenge, challengeLabel, challengeScore, newChallenge } from '../../shared/challenges';
import { ActivityEvent, ActivitySnapshot, activityEvents, takeSnapshot } from '../../shared/activity';
import { Group } from '../../shared/group.model';
import { FiltroPipe } from '../../shared/filtro.pipe';
import { MyEntry, myEntry } from '../../shared/social';

// Foto de los amigos en la última visita, por usuario y solo en este dispositivo.
function snapshotKey(uid: string): string {
  return `sexcontrol.activity.${uid}`;
}

function readSnapshot(uid: string): ActivitySnapshot | null {
  try {
    const raw = localStorage.getItem(snapshotKey(uid));
    return raw ? (JSON.parse(raw) as ActivitySnapshot) : null;
  } catch {
    return null;
  }
}

function writeSnapshot(uid: string, snapshot: ActivitySnapshot): void {
  try {
    localStorage.setItem(snapshotKey(uid), JSON.stringify(snapshot));
  } catch {
    // Sin almacenamiento local simplemente no se muestran novedades.
  }
}

// Quita de la vista los campos que no viven en Firestore (el uid va como clave, y el amigo se
// resuelve al leer), para no escribirlos de vuelta en el documento.
function plain(challenge: FriendChallenge): Challenge {
  const { uid, friend, ...rest } = challenge;
  return rest;
}

function total(friend: Friend): number {
  if (friend.hidden) {
    return -1;
  }
  return friend.total ?? (friend.solitario ?? 0) + (friend.compania ?? 0);
}

const EMPTY_SOCIAL: Social = {
  friends: [],
  requests: [],
  sent: [],
  reactions: [],
  pokes: [],
  challenges: [],
  record: {},
  wins: 0,
  privacy: {},
  groupPrivacy: {},
  paused: false,
  blocked: [],
};

@Component({
  selector: 'app-amigos',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, FiltroPipe, DatoDirective, FriendsLeagueComponent, MarcaComponent],
  templateUrl: './amigos.page.html',
  styleUrl: './amigos.page.scss',
})
export class AmigosPage {
  private authService = inject(AuthService);
  private analytics = inject(AnalyticsService);
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private groupsService = inject(GroupsService);
  private profileService = inject(ProfileService);
  private sharing = inject(SharingService);
  private ui = inject(UiService);
  private actionSheetController = inject(ActionSheetController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private settings = inject(SettingsService);

  segment: 'amigos' | 'grupos' = 'amigos';
  textoBuscar = '';
  private privacy: Record<string, PrivacyLevel> = {};
  private challenges: Record<string, FriendChallenge> = {};
  private record: Record<string, DuelRecord> = {};
  private wins = 0;
  // Duelos ya cerrados en esta sesión, para no repetir la escritura mientras llegan los cambios.
  private readonly closedChallenges = new Set<string>();
  // Foto de referencia de los amigos al entrar en la pestaña (una por usuario y sesión).
  private readonly activityBaseline = new Map<string, ActivitySnapshot | null>();

  // Todo sale de social/{uid}: 1 lectura para amigos, totales, solicitudes y reacciones.
  private readonly social$: Observable<Social> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.social$(user.uid) : of(EMPTY_SOCIAL))),
    map((social) => {
      this.privacy = social.privacy;
      this.challenges = Object.fromEntries(social.challenges.map((challenge) => [challenge.uid, challenge]));
      this.record = social.record;
      this.wins = social.wins;
      return social;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // Amigos ordenados de más a menos faps totales; los que no comparten, al final.
  readonly friends$: Observable<Friend[]> = this.social$.pipe(
    map((social) => [...social.friends].sort((a, b) => total(b) - total(a)))
  );

  // Mis propios datos con la forma de una entrada de amigo, para la liga y la ficha. Sale de
  // fapStats y del perfil, que ya están escuchándose: no cuesta lecturas.
  readonly me$: Observable<MyEntry | null> = this.authService.user$.pipe(
    switchMap((user) =>
      user
        ? combineLatest([this.profileService.profile$(user.uid), this.fapService.stats$(user.uid)]).pipe(
            map(([profile, stats]) => myEntry(user.uid, profile, stats, new Date()))
          )
        : of(null)
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly pendingRequests$: Observable<number> = this.social$.pipe(map((social) => social.requests.length));
  readonly pokes$: Observable<ReceivedPoke[]> = this.social$.pipe(map((social) => social.pokes));

  // Novedades desde la última visita a esta pestaña, comparando con la foto guardada en el
  // dispositivo. La foto se actualiza al entrar, así que lo visto no se repite.
  readonly activity$: Observable<ActivityEvent[]> = combineLatest([this.social$, this.me$]).pipe(
    map(([social, me]) => {
      if (!me) {
        return [];
      }
      const today = new Date();
      // La referencia se fija al entrar en la pestaña y no cambia mientras se está dentro: si se
      // renovara con cada actualización, los cambios que llegan en vivo se borrarían a sí mismos.
      if (!this.activityBaseline.has(me.uid)) {
        this.activityBaseline.set(me.uid, readSnapshot(me.uid));
      }
      const events = activityEvents(this.activityBaseline.get(me.uid) ?? null, me, social.friends, today);
      // Para la próxima visita, la referencia pasa a ser lo que se ve ahora.
      writeSnapshot(me.uid, takeSnapshot(social.friends, today));
      return events;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // Duelos que esperan algo mío: los que me han propuesto y aún no he contestado.
  readonly pendingChallenges$: Observable<FriendChallenge[]> = combineLatest([this.social$, this.me$]).pipe(
    map(([social, me]) =>
      me ? social.challenges.filter((challenge) => challenge.status === 'pendiente' && challenge.from !== me.uid) : []
    )
  );

  // Duelos en juego, con su marcador en vivo. Los terminados se cierran solos aquí.
  readonly liveChallenges$: Observable<{ challenge: FriendChallenge; mine: number; theirs: number }[]> = combineLatest([
    this.social$,
    this.me$,
  ]).pipe(
    map(([social, me]) => {
      if (!me) {
        return [];
      }
      const today = new Date();
      const live: { challenge: FriendChallenge; mine: number; theirs: number }[] = [];
      for (const challenge of social.challenges) {
        if (challenge.status !== 'aceptado' || !challenge.friend) {
          continue;
        }
        const score = challengeScore(challenge, me, challenge.friend, today);
        if (!score) {
          continue;
        }
        if (score.finished) {
          void this.closeChallenge(me.uid, challenge, score.winnerUid);
        } else {
          live.push({ challenge, mine: score.mine, theirs: score.theirs });
        }
      }
      return live;
    })
  );

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

  trackByPoke(_: number, poke: ReceivedPoke): string {
    return poke.id;
  }

  trackByDuelo(_: number, item: { challenge: FriendChallenge }): string {
    return item.challenge.uid;
  }

  // En modo discreto se usan los textos neutros (sin emojis explícitos ni detalles).
  get discreto(): boolean {
    return this.settings.discreet().enabled;
  }

  retoTexto(challenge: Challenge): string {
    return challengeLabel(challenge).toLowerCase();
  }

  onSegmentChange(event: CustomEvent): void {
    this.segment = event.detail.value;
    this.textoBuscar = '';
  }

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }

  // ---------------------------------------------------------------- acciones sobre un amigo

  // Al tocar un amigo se abre su ficha; las acciones de siempre salen de ella.
  async friendActions(friend: Friend): Promise<void> {
    const name = friend.displayName || 'tu amigo';
    const me = await firstValueFrom(this.me$);
    if (!me) {
      return;
    }
    const modal = await this.modalController.create({
      component: FriendDetailModal,
      componentProps: {
        friend,
        me,
        privacy: this.privacyFor(friend.uid),
        challenge: activeChallenge(this.challenges, friend.uid),
        record: this.record[friend.uid] ?? null,
      },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<FriendAction>();
    if (data === 'challenge') {
      await this.proposeChallenge(friend, name);
    } else if (data === 'accept' || data === 'reject') {
      await this.answerChallenge(friend, name, data === 'accept');
    } else if (data === 'poke') {
      await this.choosePoke(friend, name);
    } else if (data === 'react') {
      await this.chooseReaction(friend, name);
    } else if (data === 'privacy') {
      await this.choosePrivacy(friend, name);
    } else if (data === 'remove') {
      await this.confirmRemove(friend, name);
    } else if (data === 'block') {
      await this.confirmBlock(friend, name);
    }
  }

  // ---------------------------------------------------------------- invitaciones

  // Mi enlace de invitación: quien lo abra puede mandarme una solicitud sin buscarme por email.
  async shareMyInvite(): Promise<void> {
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

  // ---------------------------------------------------------------- duelos

  private async proposeChallenge(friend: Friend, name: string): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    const sheet = await this.actionSheetController.create({
      header: `Retar a ${name}`,
      buttons: [
        { text: 'Quién suma más esta semana', icon: 'trophy', data: 'semana' },
        ...CHALLENGE_TARGETS.map((target) => ({ text: `El primero en llegar a ${target}`, icon: 'flag', data: `carrera:${target}` })),
        { text: 'Cancelar', role: 'cancel', icon: 'close' },
      ],
    });
    await sheet.present();
    const { data } = await sheet.onDidDismiss<string>();
    if (!data) {
      return;
    }
    const [kind, target] = data.split(':');
    try {
      await this.friendsService.sendChallenge(
        uid,
        friend.uid,
        newChallenge(uid, kind as ChallengeKind, target ? Number(target) : null, new Date())
      );
      this.analytics.log('duelo_creado', { tipo: kind });
      await this.ui.toast(`Duelo enviado a ${name}`);
    } catch (error) {
      console.error('Error enviando el duelo', error);
      await this.ui.toast('No se pudo enviar el duelo');
    }
  }

  async answerChallenge(friend: Friend, name: string, accept: boolean): Promise<void> {
    const uid = this.authService.currentUid();
    const challenge = this.challenges[friend.uid];
    if (!uid || !challenge) {
      return;
    }
    try {
      await this.friendsService.updateChallenge(uid, friend.uid, plain(challenge), accept ? 'aceptado' : 'rechazado');
      this.analytics.log('duelo_aceptado', { aceptado: accept });
      await this.ui.toast(accept ? `¡Duelo con ${name} en marcha!` : 'Duelo rechazado');
    } catch (error) {
      console.error('Error respondiendo al duelo', error);
      await this.ui.toast('No se pudo responder al duelo');
    }
  }

  // Cierra un duelo terminado y apunta el resultado. Lo hacen los dos dispositivos con los mismos
  // datos, así que llegan al mismo ganador; la segunda escritura solo repite lo ya guardado.
  private async closeChallenge(uid: string, challenge: FriendChallenge, winnerUid: string | null): Promise<void> {
    const key = `${challenge.uid}:${challenge.week}`;
    if (this.closedChallenges.has(key)) {
      return;
    }
    this.closedChallenges.add(key);
    const current = this.record[challenge.uid] ?? { wins: 0, losses: 0 };
    const won = winnerUid === uid;
    const lost = winnerUid !== null && !won;
    try {
      await this.friendsService.updateChallenge(uid, challenge.uid, plain(challenge), 'terminado', {
        winnerUid,
        record: { wins: current.wins + (won ? 1 : 0), losses: current.losses + (lost ? 1 : 0) },
        wins: this.wins + (won ? 1 : 0),
      });
      const name = challenge.friend?.displayName || 'tu amigo';
      if (won) {
        this.ui.celebrate();
      }
      await this.ui.toast(won ? `🏆 ¡Has ganado el duelo con ${name}!` : lost ? `Has perdido el duelo con ${name}` : `Empate con ${name}`);
    } catch (error) {
      console.warn('No se pudo cerrar el duelo', error);
      this.closedChallenges.delete(key);
    }
  }

  // ---------------------------------------------------------------- pullas

  private async choosePoke(friend: Friend, name: string): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid) {
      return;
    }
    const sheet = await this.actionSheetController.create({
      header: `Pulla para ${name}`,
      buttons: [
        ...POKE_MESSAGES.map((message) => ({ text: `${message.emoji} ${message.text}`, data: message.id })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data: msg } = await sheet.onDidDismiss<string>();
    if (!msg) {
      return;
    }
    try {
      await this.friendsService.sendPoke(uid, friend.uid, { msg });
      this.analytics.log('pulla_enviada');
      await this.ui.toast(`Pulla enviada a ${name}`);
    } catch (error) {
      console.error('Error enviando la pulla', error);
      await this.ui.toast('No se pudo enviar la pulla');
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
      await this.friendsService.sendPoke(uid, friend.uid, { emoji });
      this.analytics.log('reaccion_enviada');
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

  private async confirmBlock(friend: Friend, name: string): Promise<void> {
    const alert = await this.alertController.create({
      header: `Bloquear a ${name}`,
      message: `Dejaréis de ser amigos y no podrá volver a mandarte solicitudes. Puedes desbloquearlo en Ajustes. Los grupos que compartáis no cambian.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Bloquear', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    const uid = this.authService.currentUid();
    if (role !== 'destructive' || !uid) {
      return;
    }
    try {
      const social = await firstValueFrom(this.friendsService.social$(uid));
      await this.friendsService.blockUser(uid, friend, social);
      await this.ui.toast(`Has bloqueado a ${name}`);
    } catch (error) {
      console.error('Error bloqueando', error);
      await this.ui.toast('No se pudo bloquear');
    }
  }

  async clearReactions(): Promise<void> {
    const uid = this.authService.currentUid();
    if (uid) {
      await this.friendsService.clearReactions(uid);
    }
  }
}
