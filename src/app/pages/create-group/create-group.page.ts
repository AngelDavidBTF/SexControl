import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "src/app/services/auth.service";
import { FriendsService } from "src/app/services/friends.service";
import { User } from "src/app/shared/user.interface";
import { ImagePicker, OutputType } from '@ionic-native/image-picker/ngx';
import * as moment from "moment";

@Component({
  selector: "app-create-group",
  templateUrl: "./create-group.page.html",
  styleUrls: ["./create-group.page.scss"],
})
export class CreateGroupPage {
  currentUser: User;

  friends: any = [
    {
      id: "",
      data: {} as User,
    },
  ];

  group: any;

  nameGroup: string ='';

  selectedUsers = [];
  sendUsers = [];

  textoBuscar: string;

  image = '';

  imageResponse: any;
  options: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private friendService: FriendsService,
    private imagePicker: ImagePicker
  ) {
    this.currentUser = this.authService.actualUser;
    this.getFriends(this.currentUser.uid);
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  getFriends(userUid: any) {
    this.friendService.getFriends(userUid).subscribe((result) => {
      this.friends = [];
      result.forEach((datosUser: any) => {
        this.friends.push({
          id: datosUser.payload.doc.id,
          data: datosUser.payload.doc.data(),
        });
      });
    });
  }

  addAList(user: any){
    for (let i = 0; i < this.selectedUsers.length; i++) {
      if (this.selectedUsers[i].uidFriend === user.uidFriend) {
        this.selectedUsers.splice(i, 1);
        this.sendUsers.splice(i, 1);
        return;
      }
    }
    this.selectedUsers.push(user);
    this.sendUsers.push(user.uidFriend)
  }

  createGroup() {
    this.selectedUsers.push(this.currentUser);
    this.sendUsers.push(this.currentUser.uid);
    this.group = {
      name: this.nameGroup,
      groupImage: this.image,
      users: this.sendUsers,
      creationDate: moment().format("DD/MM/YYYY HH:mm:ss")
    };
    this.friendService.preSaveGroup(this.imageResponse[0], this.group);
    this.router.navigate(["tabs/amigos"]);
  }

  handleImage(event: any): void {
    this.image = event.target.files[0];
  }

  getImages() {
    this.options = {
      maximumImagesCount: 1,
      width: 200,
      //height: 200,
      quality: 25,
      outputType: OutputType.FILE_URL
    };
    this.imageResponse = [];
    this.imagePicker.getPictures(this.options).then((results) => {
      for (var i = 0; i < results.length; i++) {
        this.imageResponse.push(results[i]);
      }
    }, (err) => {
      alert(err);
    });
  }
  
}
