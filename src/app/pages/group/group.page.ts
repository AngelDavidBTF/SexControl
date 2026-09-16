import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionSheetController, AlertController, IonicModule, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { GroupsService } from '../../core/groups.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { ShareInviteModal } from '../../components/share-invite/share-invite.modal';
import { FapCounts } from '../../shared/fap.model';
import { Group, GroupGoal, GroupMember, MAX_GROUP_GOAL } from '../../shared/group.model';
import {
  GoalProgress,
  SeasonEntry,
  Title,
  goalProgress,
  reigningChampion,
  seasonHistory,
  seasonToClose,
  weekSummary,
  weeklyTitles,
} from '../../shared/group-awards';
import { drawWeekCard } from '../../shared/group-card';
import { monthKey, weekKey } from '../../shared/stats';
import { DatoDirective } from '../../shared/dato.directive';
import { FiltroPipe } from '../../shared/filtro.pipe';
import { AddMembersModal } from './add-members.modal';

export interface MemberView {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  counts: FapCounts | null;
}

interface GroupView {
  group: Group;
  isOwner: boolean;
  members: MemberView[];
  totalCompania: number;
  totalSolitario: number;
  mediaCompania: number;
  mediaSolitario: number;
  mediaGrupo: number;
  // Novedades de grupo: campeón del mes pasado, palmarés, títulos de la semana y objetivo.
  championUid: string | null;
  seasons: SeasonEntry[];
  titles: Title[];
  goal: GoalProgress | null;
}

export type RankingPeriod = 'total' | 'mes' | 'semana';

function memberTotal(member: MemberView): number {
  return member.counts ? member.counts.compania + member.counts.solitario : -1;
}

// Totales del periodo pedido. Si la última publicación del miembro es de otra semana/mes, en el
// periodo actual lleva 0.
function countsFor(member: GroupMember, period: RankingPeriod, now: Date): FapCounts {
  if (period === 'total') {
    return { solitario: member.solitario ?? 0, compania: member.compania ?? 0 };
  }
  const entry = period === 'semana' ? member.week : member.month;
  const key = period === 'semana' ? weekKey(now) : monthKey(now);
  return entry?.key === key ? { solitario: entry.s, compania: entry.c } : { solitario: 0, compania: 0 };
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FiltroPipe, DatoDirective],
  templateUrl: './group.page.html',
  styleUrl: './group.page.scss',
})
export class GroupPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private groupsService = inject(GroupsService);
  private ui = inject(UiService);
  private actionSheetController = inject(ActionSheetController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);

  textoBuscar = '';
  verPalmares = false;
  // Vista previa de la tarjeta semanal cuando el navegador no admite compartir archivos.
  previewCard: string | null = null;
  private readonly period$ = new BehaviorSubject<RankingPeriod>('total');
  // Temporadas ya intentadas en esta sesión (el vm$ se recalcula con cada cambio del grupo).
  private readonly closing = new Set<string>();

  get period(): RankingPeriod {
    return this.period$.value;
  }

  // Todo sale del documento del grupo, que ya está en la lista de grupos del usuario: abrir
  // un grupo no cuesta lecturas extra. null: el grupo no existe o ya no perteneces a él.
  readonly vm$: Observable<GroupView | null> = combineLatest([this.route.paramMap, this.authService.user$, this.period$]).pipe(
    switchMap(([params, user, period]) => {
      const groupId = params.get('id');
      if (!groupId || !user) {
        return of(null);
      }
      return this.groupsService.group$(user.uid, groupId).pipe(
        catchError(() => of(null)),
        map((group) => {
          if (!group) {
            return null;
          }
          // Si el mes pasado aún no está cerrado, lo cierra el primero que abra el grupo.
          void this.closeSeasonIfNeeded(group);
          return this.buildView(group, user.uid, period);
        })
      );
    })
  );

  onPeriodChange(event: CustomEvent): void {
    this.period$.next(event.detail.value as RankingPeriod);
  }

  private buildView(group: Group, myUid: string, period: RankingPeriod): GroupView {
    const now = new Date();
    const members = group.memberUids.map((uid): MemberView => {
      const member = group.members?.[uid];
      return {
        uid,
        displayName: member?.displayName ?? null,
        email: null,
        photoURL: member?.photoURL ?? null,
        counts: !member || member.hidden ? null : countsFor(member, period, now),
      };
    });
    // Quien no comparte sus números queda al final y fuera de las medias.
    const sharing = members.filter((m) => m.counts);
    const sorted = [...members].sort((a, b) => memberTotal(b) - memberTotal(a));
    const totalCompania = sharing.reduce((sum, m) => sum + (m.counts?.compania ?? 0), 0);
    const totalSolitario = sharing.reduce((sum, m) => sum + (m.counts?.solitario ?? 0), 0);
    const count = sharing.length || 1;
    return {
      group,
      isOwner: group.ownerUid === myUid,
      members: sorted,
      totalCompania,
      totalSolitario,
      mediaCompania: totalCompania / count,
      mediaSolitario: totalSolitario / count,
      mediaGrupo: (totalCompania + totalSolitario) / count,
      championUid: reigningChampion(group, now),
      seasons: seasonHistory(group),
      titles: weeklyTitles(group, now),
      goal: goalProgress(group, now),
    };
  }

  // 1 escritura al mes y por grupo. Si otro miembro se ha adelantado, las reglas rechazan la
  // segunda escritura: se ignora, porque la temporada ya está cerrada.
  private async closeSeasonIfNeeded(group: Group): Promise<void> {
    const season = seasonToClose(group, new Date());
    if (!season || this.closing.has(`${group.id}:${season.key}`)) {
      return;
    }
    this.closing.add(`${group.id}:${season.key}`);
    try {
      await this.groupsService.closeSeason(group, season);
    } catch (error) {
      console.warn('No se pudo cerrar la temporada del grupo', error);
    }
  }

  async confirmLeave(group: Group): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Salir del grupo',
      message: `Dejarás de ver "${group.name}" y sus miembros dejarán de ver tus números. Solo el creador puede volver a añadirte.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salir', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    const uid = this.authService.currentUid();
    if (role !== 'destructive' || !uid) {
      return;
    }
    try {
      await this.groupsService.leaveGroup(group, uid);
      await this.router.navigate(['/tabs/amigos'], { replaceUrl: true });
      await this.ui.toast(`Has salido de "${group.name}"`);
    } catch (error) {
      console.error('Error saliendo del grupo', error);
      await this.ui.toast('No se pudo salir del grupo');
    }
  }

  // Las actualizaciones en vivo crean objetos nuevos: sin trackBy se recrearían las filas
  // (y se cerraría una fila deslizada a medias).
  trackByUid(_: number, member: MemberView): string {
    return member.uid;
  }

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }

  async presentActionSheet(group: Group): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Elija una opción',
      buttons: [
        {
          text: 'Añadir amigo al grupo',
          icon: 'person-add-outline',
          handler: () => {
            this.openAddMembers(group);
          },
        },
        {
          text: 'Invitar con enlace o QR',
          icon: 'share-social-outline',
          handler: () => {
            this.shareInvite(group);
          },
        },
        {
          text: group.goal ? 'Cambiar el objetivo del grupo' : 'Poner un objetivo al grupo',
          icon: 'checkmark-circle',
          handler: () => {
            this.editGoal(group);
          },
        },
        {
          text: 'Eliminar grupo',
          icon: 'close',
          role: 'destructive',
          handler: () => {
            this.confirmDelete(group);
          },
        },
        {
          text: 'Cancelar',
          icon: 'arrow-back',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  async removeMember(group: Group, member: MemberView): Promise<void> {
    try {
      await this.groupsService.removeMember(group, member.uid);
      await this.ui.toast(`${member.displayName || member.email || 'El miembro'} ya no está en el grupo`);
    } catch (error) {
      console.error('Error quitando miembro', error);
      await this.ui.toast('No se pudo quitar al miembro');
    }
  }

  // Objetivo colectivo: lo fija el dueño y cuenta lo de todos los miembros del periodo.
  async editGoal(group: Group): Promise<void> {
    const current = group.goal ?? null;
    const alert = await this.alertController.create({
      header: 'Objetivo del grupo',
      message: 'Entre todos los miembros, ¿cuántas veces queréis llegar?',
      inputs: [
        { name: 'target', type: 'number', placeholder: 'Por ejemplo, 50', value: current?.target ?? null, min: 1, max: MAX_GROUP_GOAL },
        { name: 'period', type: 'radio', label: 'Esta semana', value: 'semana', checked: (current?.period ?? 'mes') === 'semana' },
        { name: 'period', type: 'radio', label: 'Este mes', value: 'mes', checked: (current?.period ?? 'mes') === 'mes' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        ...(current ? [{ text: 'Quitar objetivo', role: 'destructive' }] : []),
        { text: 'Guardar', role: 'confirm' },
      ],
    });
    await alert.present();
    const { data, role } = await alert.onDidDismiss<{ values: string | { target?: string; period?: string } }>();
    if (role === 'cancel') {
      return;
    }
    try {
      if (role === 'destructive') {
        await this.groupsService.setGoal(group, null);
        await this.ui.toast('Objetivo quitado');
        return;
      }
      // Con radios y campos mezclados, Ionic devuelve el valor del radio en `values`; el número
      // hay que leerlo del propio input.
      const target = Math.floor(Number(alert.querySelector<HTMLInputElement>('input[name="target"]')?.value ?? ''));
      const period = (typeof data?.values === 'string' ? data.values : 'mes') as GroupGoal['period'];
      if (!Number.isFinite(target) || target <= 0 || target > MAX_GROUP_GOAL) {
        await this.ui.toast('Escribe un número entre 1 y ' + MAX_GROUP_GOAL);
        return;
      }
      await this.groupsService.setGoal(group, { period, target });
      await this.ui.toast(`Objetivo: ${target} ${period === 'semana' ? 'esta semana' : 'este mes'}`);
    } catch (error) {
      console.error('Error guardando el objetivo del grupo', error);
      await this.ui.toast('No se pudo guardar el objetivo');
    }
  }

  // Enlace de invitación al grupo (solo el dueño). Quien lo abra podrá entrar aunque no sea amigo
  // suyo, así que la pantalla de destino avisa de lo que se comparte.
  async shareInvite(group: Group): Promise<void> {
    const loading = await this.ui.loading('Preparando la invitación…');
    try {
      const code = await this.groupsService.ensureInviteCode(group);
      await loading.dismiss();
      const modal = await this.modalController.create({
        component: ShareInviteModal,
        componentProps: {
          url: `${location.origin}/unirse/${code}`,
          title: `Invitar a ${group.name}`,
          subtitle: 'Quien abra el enlace o escanee el QR podrá entrar en el grupo.',
          warning: 'Cualquiera con el enlace puede entrar, aunque no sea amigo tuyo. Si se te va de las manos, genera uno nuevo.',
          canRenew: true,
          onRenew: async () => `${location.origin}/unirse/${await this.groupsService.renewInviteCode(group)}`,
        },
      });
      await modal.present();
    } catch (error) {
      await loading.dismiss();
      console.error('No se pudo preparar la invitación', error);
      await this.ui.toast('No se pudo preparar la invitación');
    }
  }

  // Resumen de la semana como imagen: campeón, total, títulos y clasificación.
  async shareWeek(group: Group): Promise<void> {
    const loading = await this.ui.loading('Preparando el resumen…');
    try {
      const blob = await drawWeekCard(weekSummary(group, new Date()));
      const file = new File([blob], `resumen-${group.name.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
      await loading.dismiss();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: group.name }).catch(() => undefined);
      } else {
        this.previewCard = URL.createObjectURL(blob);
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error generando el resumen del grupo', error);
      await this.ui.toast('No se pudo generar el resumen');
    }
  }

  closePreview(): void {
    if (this.previewCard) {
      URL.revokeObjectURL(this.previewCard);
      this.previewCard = null;
    }
  }

  private async openAddMembers(group: Group): Promise<void> {
    const modal = await this.modalController.create({
      component: AddMembersModal,
      componentProps: { group },
    });
    await modal.present();
  }

  private async confirmDelete(group: Group): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar grupo',
      subHeader: '¿Estás seguro de eliminar el grupo?',
      message: 'Esta opción no es reversible.',
      buttons: [
        {
          text: 'Sí, eliminar',
          handler: () => {
            this.deleteGroup(group);
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });
    await alert.present();
  }

  private async deleteGroup(group: Group): Promise<void> {
    try {
      await this.groupsService.deleteGroup(group);
      await this.router.navigate(['/tabs/amigos'], { replaceUrl: true });
      await this.ui.toast('Grupo eliminado');
    } catch (error) {
      console.error('Error eliminando grupo', error);
      await this.ui.toast('No se pudo eliminar el grupo');
    }
  }
}
