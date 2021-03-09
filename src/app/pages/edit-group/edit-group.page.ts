import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ActionSheetController, ModalController } from "@ionic/angular";
import { FriendsService } from "src/app/services/friends.service";
import { User } from "../../shared/user.interface";
import { ModalPage } from './modal/modal.page';

@Component({
  selector: "app-edit-group",
  templateUrl: "./edit-group.page.html",
  styleUrls: ["./edit-group.page.scss"],
})
export class EditGroupPage implements OnInit {
  group: any;

  users: any = [
    {
      id: "",
      data: {} as User,
    },
  ];

  textoBuscar = "";

  constructor(
    private friendService: FriendsService,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.group = this.friendService.actualGroup;
    this.getFriends();
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  getFriends() {
    this.friendService.getFriendsByGroup().subscribe((result) => {
      this.users = [];
      result.forEach((datosUser: any) => {
        this.users.push({
          id: datosUser.payload.doc.id,
          data: datosUser.payload.doc.data(),
        });
      });
    });
  }

  async addFriendGroup() {
      const modal = await this.modalController.create({
        component: ModalPage,
        componentProps: {
          group: this.group
        }
      });
      return await modal.present();
  }

  deleteFriendGroup(user: any) {
      this.friendService.deleteFriendInGroup(user).then(() => {
        this.getFriends();
      });
  }

  showAlert() {
    this.presentActionSheet();
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: "Elija una opción",
      buttons: [
        {
          text: "Añadir amigo al grupo",
          icon: "person-add-outline",
          handler: () => {
            this.addFriendGroup();
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
