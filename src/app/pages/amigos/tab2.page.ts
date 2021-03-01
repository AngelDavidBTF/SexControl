import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { FapService } from 'src/app/services/fap.service';
import { FriendsService } from 'src/app/services/friends.service';
import { User } from 'src/app/shared/user.interface';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  currentUser: User;

  users: any = [{
    id: '',
    data: {} as User
   }];

  requestUsers: any = [{
    id: '',
    data: {} as User
   }];

  friends: any = [{
    id: '',
    data: {} as User
   }];

  segmentModel = 'amigos';

  friendsFiltrados: any = [];

  numberNotification: number;
  
  textoBuscar = '';

  constructor(private router: Router,
              private authService: AuthService,
              private friendService: FriendsService,
              private fapService: FapService) 
      {
        this.authService.user$.subscribe(user => {
          this.currentUser = {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email
          };
          /*this.friendService.getUsers(user.uid).subscribe((result) => {
            this.users = [];
            result.forEach((datosUser: any) => {
              let fapUser = [];
              this.fapService.getNumeroFap(datosUser.payload.doc.id).subscribe((result) => {
                result.forEach((datosFap: any) => {
                  fapUser.push(
                    datosFap.payload.doc.data()
                  );
                });
                this.users.push({
                  id: datosUser.payload.doc.id,
                  data: datosUser.payload.doc.data(),
                  faps: fapUser,
                  numero: {}
                });

                let numeroC = 0;
                let numeroS = 0;
                let index = -1;
                this.users.forEach(element1 => {
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
                this.users[index].numero = {numberC: numeroC, numberS: numeroS};
              }); 
            }); 
          }); */
          this.getNumeroSolicitudes(user.uid);
          this.getFriends(user.uid);
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
          data: datosUser.payload.doc.data()
        });
      });

      this.numberNotification = 0;
      if ( this.requestUsers.length !== 0 ) {
        for (const user of this.requestUsers) {
            this.numberNotification++;
        }
      }
    });
  }

  getFriends(userUid: any) {
    this.friendService.getFriends(userUid).subscribe((result) => {
      this.friends = [];
      result.forEach((datosUser: any) => {
        this.friends.push({
          id: datosUser.payload.doc.id,
          data: datosUser.payload.doc.data()
        });
      });
    })
  }

  segmentChanged(event: any) {
    // console.log(event.detail.value);
  }

  addFriend(){
    this.router.navigate(['add-friend']);
  }

  requestFriend(){
    this.router.navigate(['request-friends']);
  }


}
