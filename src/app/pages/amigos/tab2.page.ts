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

  /* chargeActualUser() {
    this.authService.getActualUser().subscribe((result) => {
      this.actualUser = result;
      this.getNumeroSolicitudes(this.currentUser.uid);
      this.getFriends(this.currentUser.uid);
      this.getGroups();
    });
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

      this.numberNotification = this.requestUsers.length;
    });
  }

  /*getFriends(userUid: any) {
    this.friendsSubscription = this.friendService
      .getFriends(userUid)
      .subscribe((result) => {
        this.friends = [];
        this.friendsUid = [];
        result.forEach((datosUser: any) => {
          this.friends.push({
            id: datosUser.payload.doc.id,
            data: datosUser.payload.doc.data(),
          });
          this.friendsUid.push(datosUser.payload.doc.id);
        });
        this.getFapFriends();
      });
  } */
  /* getFapFriends() {
  this.friendService.getNumeroFapByFriends(this.friendsUid).subscribe((result) => {
    // todos los datos
    this.arrayColeccionFaps = [];
    result.forEach((datosFap: any) => {
      this.arrayColeccionFaps.push({
        id: datosFap.payload.doc.id,
        data: datosFap.payload.doc.data(),
      });
    });

    this.arraySolitario = [];
    this.arrayCompania = [];
    this.arrayColeccionFaps.forEach((element: any ) => {
        if (element.data.solitario === true) {
          this.arraySolitario.push({
            user: element.data.uid,
            fap: element
          }); 
        } else {
          this.arrayCompania.push({
            user: element.data.uid,
            faps: element
          });
        }
    });

      this.friends.forEach((element: any, i: number ) => {
        var reducedS = this.arrayColeccionFaps.reduce(function(filtered, option) {
          if (option.data.uid === element.data.uidFriend) {
            if(option.data.solitario === true) {
              var someNewValue = { fap: option.data, uid: option.data.uid }
              filtered.push(someNewValue);
            }
          }
          return filtered;
        }, []);
        var reducedC = this.arrayColeccionFaps.reduce(function(filtered, option) {
          if (option.data.uid === element.data.uidFriend) {
            if(option.data.solitario === false) {
              var someNewValue = { fap: option.data, uid: option.data.uid }
              filtered.push(someNewValue);
            }
          }
          return filtered;
        }, []);
        this.friends[i].solitario =  reducedS;
        this.friends[i].compania =  reducedC;
      });

      this.friends = this.friends.sort((a: any, b: any) => {
        const totalS1 = a.solitario.length;
        const totalS2 = b.solitario.length;
        const totalC1 = a.compania.length;
        const totalC2 = b.compania.length;
        const total1 = totalS1 + totalC1;
        const total2 = totalS2 + totalC2;
        return total2 - total1;
      });
  });
} */

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  getNumeroSolicitudes() {
    this.friendService.getRequestFriends(this.currentUser.uid).subscribe((response) => {
      this.requestUsers = response.requestFriends;
      this.friendService.requestFriend = this.requestUsers;
      this.numberNotification = this.requestUsers.length;
    },
      (error) => {
        console.error('Error al enviar la solicitud:', error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
  }

  getFriends() {
    this.friendService.getFriends(this.currentUser.uid).subscribe((response) => {
      this.friends = response.friends;
    },
      (error) => {
        console.error('Error al enviar la solicitud:', error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
  }

  getFapFriends() {
    this.friendService
      .getNumeroFapByFriends(this.friendsUid)
      .subscribe((result) => {
        this.arrayColeccionFaps = result.map((datosFap) => ({
          id: datosFap.payload.doc.id,
          data: datosFap.payload.doc.data(),
        }));

        this.arraySolitario = this.arrayColeccionFaps
          .filter((element) => element.data.solitario === true)
          .map((element) => ({
            user: element.data.uid,
            fap: element,
          }));

        this.arrayCompania = this.arrayColeccionFaps
          .filter((element) => element.data.solitario !== true)
          .map((element) => ({
            user: element.data.uid,
            faps: element,
          }));

        this.friends = this.friends.map((friend) => {
          friend.solitario = this.arrayColeccionFaps
            .filter(
              (fap) =>
                fap.data.uid === friend.data.uidFriend &&
                fap.data.solitario === true
            )
            .map((fap) => ({ fap: fap.data, uid: fap.data.uid }));
          friend.compania = this.arrayColeccionFaps
            .filter(
              (fap) =>
                fap.data.uid === friend.data.uidFriend &&
                fap.data.solitario !== true
            )
            .map((fap) => ({ fap: fap.data, uid: fap.data.uid }));
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
    this.friendService.getGroups(this.currentUser.uid).subscribe(result => {
      this.groups = result.map(datosUser => ({
        id: datosUser.payload.doc.id,
        data: datosUser.payload.doc.data(),
      }));
    });
  }


  editGroup(group: any) {
    this.friendService.chargeEditGroup(group);
  }

  ngOnDestroy() {
    this.friendsSubscription.unsubscribe();
  }
}
