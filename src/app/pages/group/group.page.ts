import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionSheetController, AlertController, IonicModule, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { GroupsService } from '../../core/groups.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FapCounts } from '../../shared/fap.model';
import { Group } from '../../shared/group.model';
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

function memberTotal(member: MemberView): number {
  return (member.counts?.compania ?? 0) + (member.counts?.solitario ?? 0);
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FiltroPipe],
  templateUrl: './group.page.html',
  styleUrl: './group.page.scss',
})
export class GroupPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private groupsService = inject(GroupsService);
  private ui = inject(UiService);
  private actionSheetController = inject(ActionSheetController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);

  textoBuscar = '';

  // null: el grupo no existe o ya no se tiene acceso (p. ej. te han sacado o se ha borrado).
  readonly vm$: Observable<GroupView | null> = combineLatest([this.route.paramMap, this.authService.user$]).pipe(
    switchMap(([params, user]) => {
      const groupId = params.get('id');
      if (!groupId || !user) {
        return of(null);
      }
      return this.groupsService.group$(groupId).pipe(
        catchError(() => of(null)),
        switchMap((group) => (group ? this.buildView(group, user.uid) : of(null)))
      );
    })
  );

  private buildView(group: Group, myUid: string): Observable<GroupView> {
    return combineLatest(
      group.memberUids.map((uid) =>
        combineLatest([
          this.groupsService.userProfile$(uid).pipe(catchError(() => of(null))),
          this.fapService.fapCounts$(uid).pipe(catchError(() => of(null))),
        ]).pipe(
          map(
            ([profile, counts]): MemberView => ({
              uid,
              displayName: profile?.displayName ?? null,
              email: profile?.email ?? null,
              photoURL: profile?.photoURL ?? null,
              counts,
            })
          )
        )
      )
    ).pipe(
      map((members) => {
        const sorted = [...members].sort((a, b) => memberTotal(b) - memberTotal(a));
        const totalCompania = members.reduce((sum, m) => sum + (m.counts?.compania ?? 0), 0);
        const totalSolitario = members.reduce((sum, m) => sum + (m.counts?.solitario ?? 0), 0);
        const count = members.length || 1;
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
      })
    );
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
