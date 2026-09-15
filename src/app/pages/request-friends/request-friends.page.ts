import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FriendsService } from '../../core/friends.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FriendRequest } from '../../shared/friend.model';
import { FiltroPipe } from '../../shared/filtro.pipe';

// Vista de una solicitud con los campos que entiende FiltroPipe.
interface RequestView {
  request: FriendRequest;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

@Component({
  selector: 'app-request-friends',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FiltroPipe],
  templateUrl: './request-friends.page.html',
})
export class RequestFriendsPage {
  private authService = inject(AuthService);
  private friendsService = inject(FriendsService);
  private ui = inject(UiService);
  private actionSheetController = inject(ActionSheetController);

  textoBuscar = '';

  readonly requests$: Observable<RequestView[]> = this.authService.user$.pipe(
    switchMap((user) => (user ? this.friendsService.incomingRequests$(user.uid) : of([]))),
    map((requests) =>
      requests.map((request) => ({
        request,
        displayName: request.fromDisplayName,
        email: request.fromEmail,
        photoURL: request.fromPhotoURL,
      }))
    )
  );

  onSearchChange(event: CustomEvent): void {
    this.textoBuscar = event.detail.value ?? '';
  }

  async presentActionSheet(view: RequestView): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: '¿Aceptar petición de amistad?',
      buttons: [
        {
          text: 'Aceptar',
          icon: 'checkmark-outline',
          handler: () => {
            this.aceptar(view.request);
          },
        },
        {
          text: 'Rechazar',
          icon: 'close',
          role: 'destructive',
          handler: () => {
            this.rechazar(view.request);
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

  private async aceptar(request: FriendRequest): Promise<void> {
    const me = this.authService.currentUser();
    if (!me) {
      return;
    }
    try {
      await this.friendsService.acceptRequest(request, me);
      await this.ui.toast('Solicitud aceptada');
    } catch (error) {
      console.error('Error aceptando solicitud', error);
      await this.ui.toast('No se pudo aceptar la solicitud');
    }
  }

  private async rechazar(request: FriendRequest): Promise<void> {
    try {
      await this.friendsService.rejectRequest(request);
      await this.ui.toast('Solicitud rechazada');
    } catch (error) {
      console.error('Error rechazando solicitud', error);
      await this.ui.toast('No se pudo rechazar la solicitud');
    }
  }
}
