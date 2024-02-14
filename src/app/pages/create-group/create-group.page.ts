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

  friends: any[];

  group: any;

  nameGroup: string ='';

  selectedUsers = [];
  sendUsers = [];

  textoBuscar: string;

  image = '';

  imageResponse: any;
  options: any;

  actualUser: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private friendService: FriendsService,
    private imagePicker: ImagePicker
  ) {
    this.currentUser = this.authService.actualUser;
    this.getFriends();
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  getFriends() {
    this.friends = this.friendService.friends;
  }

  addAList(user: any){
    for (let i = 0; i < this.selectedUsers.length; i++) {
      if (this.selectedUsers[i].id === user.id) {
        this.selectedUsers.splice(i, 1);
        this.sendUsers.splice(i, 1);
        return;
      }
    }
    this.selectedUsers.push(user);
    this.sendUsers.push(user.id)
  }

  createGroup() {
    this.group = {
      name: this.nameGroup,
      groupImage: this.image,
      users: this.sendUsers,
      creationDate: moment().format("DD/MM/YYYY HH:mm:ss")
    };
    if(this.imageResponse) {
      this.friendService.preSaveGroup(this.imageResponse[0], this.group);
    } else {
      this.friendService.createGroup(this.group).subscribe(
        (response) => {
          
        },
        (error) => {
          console.error("Error al enviar la solicitud:", error);
        }
      );;
    }
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
