import { Component, Input } from "@angular/core";
import { AuthService } from "src/app/services/auth.service";
import { FriendsService } from "../../services/friends.service";
import { User } from "../../shared/user.interface";
import { RequestFriend } from "../../shared/request.interface";
import { ToastController } from "@ionic/angular";

@Component({
  selector: "app-add-friend",
  templateUrl: "./add-friend.page.html",
  styleUrls: ["./add-friend.page.scss"],
})
export class AddFriendPage {
  users: any = [
    {
      id: "",
      data: {} as User,
    },
  ];

  currentUser: User;

  peticion: RequestFriend;

  textoBuscar = "";

  actualUser: any;

  constructor(
    private authService: AuthService,
    private friendService: FriendsService,
    public toastController: ToastController
  ) {
    this.currentUser = this.authService.actualUser;
    this.chargeActualUser();
    }

    chargeActualUser() {
      this.authService.getActualUser().subscribe((result) => {
        this.actualUser = result;
        this.friendService.getUsers(this.currentUser.uid).subscribe((result) => {
          // todos los usuarios
          this.users = [];
          result.forEach((datosUser: any) => {
            this.users.push({
              id: datosUser.payload.doc.id,
              data: datosUser.payload.doc.data(),
            });
          });
        });
      });
    }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  enviarPeticon(uidDestinatario: any) {
    this.peticion = {
      uidRemitente: this.currentUser.uid,
      uidDestinatario,
      photoURL: this.currentUser.photoURL,
      displayName: this.currentUser.displayName,
      email: this.currentUser.email,
      aceptado: false,
    };
    this.friendService.sendRequestFriend(this.peticion);
    this.presentToast();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Se ha enviado la petición correctamente',
      duration: 3000
    });
    toast.present();
  }
}
