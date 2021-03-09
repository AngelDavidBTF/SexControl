import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FriendsService } from '../../../services/friends.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  styleUrls: ['./modal.page.scss'],
})
export class ModalPage implements OnInit {

  @Input() group: any;

  friendsSubscription: Subscription;

  friends:  any;

  textoBuscar = "";

  selectedUsers = [];
  uidList = [];

  constructor(
    private modalCtrl: ModalController,
    private friendService: FriendsService
  ) { }

  ngOnInit() {
    this.friendsSubscription = this.friendService.getFriendsNotInGroup().subscribe((result) => {
      this.friends = [];
      result.forEach((datosUser: any) => {
        this.friends.push({
          id: datosUser.payload.doc.id,
          data: datosUser.payload.doc.data()
        });
      });
    });
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  addFriendToList(user: any) {
    for (let i = 0; i < this.selectedUsers.length; i++) {
      if (this.selectedUsers[i].uidFriend === user.uidFriend) {
        this.selectedUsers.splice(i, 1);
        return;
      }
    }
    this.selectedUsers.push(user);
    this.uidList.push(user.uidFriend);
  }

  addFriendsToGroup() {
    this.friendService.addFriendToGroup(this.uidList);
    this.closeModal();
  }

}
