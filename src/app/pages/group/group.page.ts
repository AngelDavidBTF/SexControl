import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionSheetController, AlertController, IonicModule, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { GroupsService } from '../../core/groups.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FapCounts } from '../../shared/fap.model';
import { Group, GroupMember } from '../../shared/group.model';
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
  private readonly period$ = new BehaviorSubject<RankingPeriod>('total');

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
        map((group) => (group ? this.buildView(group, user.uid, period) : null))
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
    };
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
