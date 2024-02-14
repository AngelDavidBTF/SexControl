import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AuthService } from "src/app/services/auth.service";
import { FriendsService } from "src/app/services/friends.service";
import { Fap } from "src/app/shared/fap.interface";
import { User } from "src/app/shared/user.interface";

@Component({
  selector: "app-tab2",
  templateUrl: "tab2.page.html",
  styleUrls: ["tab2.page.scss"],
})
export class Tab2Page {
  currentUser: User;

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

  friends = [];

  arrayColeccionFaps: any = [
    {
      id: "",
      data: {} as Fap,
    },
  ];

  friendsSubscription: Subscription;

  groups: any;

  segmentModel = "amigos";

  friendsUid: any = [];

  numberNotification = 0;

  textoBuscar = "";

  arraySolitario = [];
  arrayCompania = [];

  actualUser: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private friendService: FriendsService
  ) {
    this.currentUser = this.authService.actualUser;
    this.getFriends();
    this.getNumeroSolicitudes();
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  getNumeroSolicitudes() {
    this.friendService.getRequestFriends(this.currentUser.uid).subscribe(
      (response) => {
        this.requestUsers = response.requestFriends;
        this.friendService.requestFriend = this.requestUsers;
        this.numberNotification = this.requestUsers.length;
      },
      (error) => {
        console.error("Error al enviar la solicitud:", error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
  }

  getFriends() {
    this.friendService.getFriends(this.currentUser.uid).subscribe(
      (response) => {
        this.friends = response.friends;
        this.friendService.friends = this.friends;
        this.getFapFriends();
      },
      (error) => {
        console.error("Error al enviar la solicitud:", error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
  }

  getFapFriends() {
    this.friendService.getFapByFriends().subscribe(
      (response) => {
        this.arrayColeccionFaps = response.faps_friends;

        this.arraySolitario = this.arrayColeccionFaps
          .filter((element) => element.solitario)
          .map((element) => ({
            user: element.usuario,
            fap: element,
          }));

        this.arrayCompania = this.arrayColeccionFaps
          .filter((element) => !element.solitario)
          .map((element) => ({
            user: element.usuario,
            faps: element,
          }));

        this.friends = this.friends.map((friend) => {
          friend.solitario = this.arrayColeccionFaps
            .filter((fap) => fap.user_id === friend.id && fap.solitario)
            .map((fap) => ({ fap: fap, userId: fap.usuario }));
          friend.compania = this.arrayColeccionFaps
            .filter((fap) => fap.user_id === friend.id && !fap.solitario)
            .map((fap) => ({ fap: fap, userId: fap.usuario }));
          return friend;
        });

        this.friends.sort((a, b) => {
          const totalS1 = a.solitario.length;
          const totalS2 = b.solitario.length;
          const totalC1 = a.compania.length;
          const totalC2 = b.compania.length;
          const total1 = totalS1 + totalC1;
          const total2 = totalS2 + totalC2;
          return total2 - total1;
        });
      },
      (error) => {
        console.error("Error al enviar la solicitud:", error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
  }

  segmentChanged(event: any) {
    if(!this.groups) {
      this.getGroups();
    }
  }

  addFriend() {
    this.router.navigate(["add-friend"]);
  }

  requestFriend() {
    this.router.navigate(["request-friends"]);
  }

  createGroup() {
    this.router.navigate(["create-group"]);
  }

  getGroups() {
    this.friendService.getGroups("").subscribe(
      (response) => {
        this.groups = response.data;
      },
      (error) => {
        console.error("Error al enviar la solicitud:", error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
  }

  editGroup(group: any) {
    this.friendService.chargeEditGroup(group);
  }

  ngOnDestroy() {
    this.friendsSubscription.unsubscribe();
  }
}
