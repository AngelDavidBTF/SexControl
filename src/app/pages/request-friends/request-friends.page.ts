import { Component, OnInit } from "@angular/core";
import { ActionSheetController } from "@ionic/angular";
import { AuthService } from "src/app/services/auth.service";
import { FriendsService } from "src/app/services/friends.service";
import { RequestFriend } from "src/app/shared/request.interface";
import { User } from "src/app/shared/user.interface";

@Component({
  selector: "app-request-friends",
  templateUrl: "./request-friends.page.html",
  styleUrls: ["./request-friends.page.scss"],
})
export class RequestFriendsPage {
  users: any = [
    {
      id: "",
      data: {} as User,
    },
  ];

  requestUsers: any = [
    {
      id: "",
      data: {} as User,
    },
  ];

  requestUserFiltrados: any = [];

  requestFriends:any = [];

  currentUser: User;

  peticion: RequestFriend;

  usuarioPeticion: RequestFriend;

  textoBuscar = "";

  actualUser: any;

  constructor(
    private authService: AuthService,
    public friendService: FriendsService,
    public actionSheetController: ActionSheetController
  ) {
    this.currentUser = this.authService.actualUser;
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  showAlert(user: any) {
    this.presentActionSheet(user);
  }

  aceptarPeticon(user: any, aceptado: boolean) {
    this.friendService.processRequestFriend(user, aceptado);
    this.friendService.setData("actualizar");
  }

  denegarPeticon(user: any) {
    this.friendService.processRequestFriend(user, false);
    this.friendService.setData("actualizar");
  }

  async presentActionSheet(user: any) {
    const actionSheet = await this.actionSheetController.create({
      header: "¿Aceptar petición de amistad?",
      buttons: [
        {
          text: "Aceptar",
          icon: "checkmark-outline",
          handler: () => {
            this.aceptarPeticon(user, true);
          },
        },
        {
          text: "Rechazar",
          icon: "close",
          role: "destructive",
          cssClass: "red",
          handler: () => {
            this.denegarPeticon(user);
          },
        },
        {
          text: "Cancelar",
          icon: "arrow-back",
          role: "cancel",
          handler: () => {},
        },
      ],
    });
    await actionSheet.present();
  }
}
