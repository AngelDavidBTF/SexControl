import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { Observable, firstValueFrom, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { FriendsService } from '../../core/friends.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { Friend } from '../../shared/friend.model';
import { FiltroPipe } from '../../shared/filtro.pipe';

@Component({
  selector: 'app-request-friends',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FiltroPipe],
  templateUrl: './request-friends.page.html',
})
export class RequestFriendsPage {
  private authService = inject(AuthService);
  private fapService = inject(FapService);
  private friendsService = inject(FriendsService);
  private ui = inject(UiService);
  private actionSheetController = inject(ActionSheetController);

  textoBuscar = '';

  readonly requests$: Observable<Friend[]> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.social$(user.uid) : of(null))),
    map((social) => social?.requests ?? [])
  );

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }

  async presentActionSheet(request: Friend): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: '¿Aceptar petición de amistad?',
      buttons: [
        {
          text: 'Aceptar',
          icon: 'checkmark-outline',
          handler: () => {
            this.aceptar(request);
          },
        },
        {
          text: 'Rechazar',
          icon: 'close',
          role: 'destructive',
          handler: () => {
            this.rechazar(request);
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

  private async aceptar(request: Friend): Promise<void> {
    const me = this.authService.currentUser();
    if (!me) {
      return;
    }
    try {
      const myCounts = await firstValueFrom(this.fapService.fapCounts$(me.uid));
      await this.friendsService.acceptRequest(me, myCounts, request);
      await this.ui.toast('Solicitud aceptada');
    } catch (error) {
      console.error('Error aceptando solicitud', error);
      await this.ui.toast('No se pudo aceptar la solicitud');
    }
  }

  private async rechazar(request: Friend): Promise<void> {
    const me = this.authService.currentUser();
    if (!me) {
      return;
    }
    try {
      await this.friendsService.rejectRequest(me, request);
      await this.ui.toast('Solicitud rechazada');
    } catch (error) {
      console.error('Error rechazando solicitud', error);
      await this.ui.toast('No se pudo rechazar la solicitud');
    }
  }
}
