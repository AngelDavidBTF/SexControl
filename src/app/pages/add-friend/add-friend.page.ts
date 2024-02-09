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
  users: any = [];

  currentUser: User;

  peticion: any;

  textoBuscar = "";

  actualUser: any;

  constructor(
    private authService: AuthService,
    private friendService: FriendsService,
    public toastController: ToastController
  ) {
    this.currentUser = this.authService.actualUser;
    this.loadAllUsers();
  }

  loadAllUsers() {
    this.friendService.getAllUsers().subscribe((response) => {
      this.users = response;
    },
      (error) => {
        console.error('Error al enviar la solicitud:', error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  enviarPeticon(idDestinatario: any) {
    this.peticion = {
      "usuario_receptor_id" : idDestinatario
    }
    this.friendService.sendRequestFriend(this.peticion).subscribe((response) => {
      
    },
      (error) => {
        console.error('Error al enviar la solicitud:', error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
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
