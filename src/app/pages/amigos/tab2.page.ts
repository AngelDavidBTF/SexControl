import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AuthService } from "src/app/services/auth.service";
import { FapService } from "src/app/services/fap.service";
import { FriendsService } from "src/app/services/friends.service";
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

  friends: any = [
    {
      id: "",
      data: {} as User,
    },
  ];

  friendsSubscription: Subscription;

  groups: any;

  segmentModel = "amigos";

  friendsFiltrados: any = [];

  numberNotification: number;

  textoBuscar = "";

  constructor(
    private router: Router,
    private authService: AuthService,
    private friendService: FriendsService,
    private fapService: FapService
  ) {
    this.currentUser = this.authService.actualUser;
        this.getNumeroSolicitudes(this.currentUser.uid);
        this.getFriends(this.currentUser.uid);
        this.getGroups();
    }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  getNumeroSolicitudes(userUid: any) {
    this.friendService.getRequestFriends(userUid).subscribe((result) => {
      this.requestUsers = [];
      result.forEach((datosUser: any) => {
        this.requestUsers.push({
          id: datosUser.payload.doc.id,
          data: datosUser.payload.doc.data(),
        });
      });

      this.numberNotification = 0;
      if (this.requestUsers.length !== 0) {
        for (const user of this.requestUsers) {
          this.numberNotification++;
        }
      }
    });
  }

  getFriends(userUid: any) {
    this.friendsSubscription = this.friendService.getFriends(userUid).subscribe((result) => {
      this.friends = [];
      result.forEach((datosUser: any) => {
        this.friends.push({
          id: datosUser.payload.doc.id,
          data: datosUser.payload.doc.data()
        });
        /*let fapUser = [];
        this.fapService
          .getNumeroFap(datosUser.payload.doc.id)
          .subscribe((result) => {
            result.forEach((datosFap: any) => {
              fapUser.push(datosFap.payload.doc.data());
            });
            this.friends.push({
              id: datosUser.payload.doc.id,
              data: datosUser.payload.doc.data(),
              faps: fapUser,
              numero: {},
            });

            let numeroC = 0;
            let numeroS = 0;
            let index = -1;
            this.friends.forEach((element1) => {
              numeroC = 0;
              numeroS = 0;
              index++;
              element1.faps.forEach((element: any) => {
                if (element.solitario === false) {
                  numeroC++;
                } else {
                  numeroS++;
                }
              });
            });
            this.friends[index].numero = { numberC: numeroC, numberS: numeroS };
          }); */
      });
    });
  }

  segmentChanged(event: any) {
    // console.log(event.detail.value);
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
    this.friendService.getGroups(this.currentUser.uid).subscribe((result) => {
      this.groups = [];
      result.forEach((datosUser: any) => {
        this.groups.push({
          id: datosUser.payload.doc.id,
          data: datosUser.payload.doc.data(),
        });
      });
    });
  }

  editGroup(group: any) {
    this.friendService.chargeEditGroup(group);
  }

  ngOnDestroy() {
    this.friendsSubscription.unsubscribe();
  }
}
