import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { FriendsService } from 'src/app/services/friends.service';
import { RequestFriend } from 'src/app/shared/request.interface';
import { User } from 'src/app/shared/user.interface';

@Component({
  selector: 'app-request-friends',
  templateUrl: './request-friends.page.html',
  styleUrls: ['./request-friends.page.scss'],
})
export class RequestFriendsPage {

  users: any = [{
    id: '',
    data: {} as User
   }];

   requestUsers: any = [{
    id: '',
    data: {} as User
   }];

  requestUserFiltrados: any = [];

  currentUser: User;

  peticion: RequestFriend;

  usuarioPeticion: RequestFriend;

  textoBuscar = '';

  constructor(private authService: AuthService,
              private friendService: FriendsService,
              public actionSheetController: ActionSheetController)
              {
                this.authService.user$.subscribe(user => {
                  this.currentUser = {
                    uid: user.uid,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    email: user.email
                  };

                  if (user) {
                    this.friendService.getRequestFriends(user.uid).subscribe((result) => {
                      this.requestUsers = [];
                      result.forEach((datosUser: any) => {
                        this.requestUsers.push({
                          id: datosUser.payload.doc.id,
                          data: datosUser.payload.doc.data()
                        });
                      });
                    });
                  }
                });
              }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  showAlert(user: any) {
    this.presentActionSheet(user);
  }

  aceptarPeticon(user: any) {
    this.peticion = {
      uidRemitente: user.id,
      uidDestinatario: this.currentUser.uid,
      email: user.data.email,
      displayName: user.data.displayName,
      photoURL: user.data.photoURL,
      aceptado: true
    };

    this.usuarioPeticion = {
      uidRemitente: this.currentUser.uid,
      uidDestinatario: user.id,
      email: this.currentUser.email,
      displayName: this.currentUser.displayName,
      photoURL: this.currentUser.photoURL,
      aceptado: true
    }

    this.friendService.proccessRequestFriend(this.peticion, this.usuarioPeticion);

  }

  denegarPeticon(user: any) {
    this.peticion = {
      uidRemitente: user.id,
      uidDestinatario: this.currentUser.uid,
      email: user.data.email,
      displayName: user.data.displayName,
      photoURL: user.data.photoURL,
      aceptado: false
    };

    this.usuarioPeticion = {
      uidRemitente: this.currentUser.uid,
      uidDestinatario: user.id,
      email: this.currentUser.email,
      displayName: this.currentUser.displayName,
      photoURL: this.currentUser.photoURL,
      aceptado: false
    }

    this.friendService.proccessRequestFriend(this.peticion, this.usuarioPeticion);

  }

  async presentActionSheet(user: any) {
    const actionSheet = await this.actionSheetController.create({
      header: '¿Aceptar petición de amistad?',
      buttons: [{
        text: 'Aceptar',
        icon: 'checkmark-outline',
        handler: () => {
          this.aceptarPeticon(user);
        }
      }, {
        text: 'Rechazar',
        icon: 'close',
        role: 'destructive',
        cssClass: 'red',
        handler: () => {
          this.denegarPeticon(user);
        }
      }, {
        text: 'Cancelar',
        icon: 'arrow-back',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });
    await actionSheet.present();
  }

}
