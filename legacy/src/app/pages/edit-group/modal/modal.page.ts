import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FriendsService } from '../../../services/friends.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  styleUrls: ['./modal.page.scss'],
})
export class ModalPage implements OnInit {

  @Input() group: any;

  friendsSubscription: Subscription;

  friends:  any;

  friendsIngroup: any;

  usersNotInGroup: any;

  textoBuscar = "";

  selectedUsers = [];
  idList = [];

  constructor(
    private modalCtrl: ModalController,
    private friendService: FriendsService,
    private router: Router
  ) { }

  ngOnInit() {
    this.friendsNotInGroup();
  }

  friendsNotInGroup(){
    this.friends = this.friendService.friends;
    this.friendsIngroup = this.friendService.friendsInGroup;
    // Convertir el primer array en un conjunto de ids
    const idsFriendsInGroup = new Set(this.friendsIngroup.map(objeto => objeto.id));

    // Filtrar el segundo array para obtener los objetos que no están en el primer array
     this.usersNotInGroup = this.friends.filter(objeto => !idsFriendsInGroup.has(objeto.id));
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  addFriendToList(user: any) {
    for (let i = 0; i < this.selectedUsers.length; i++) {
      if (this.selectedUsers[i].id === user.id) {
        this.selectedUsers.splice(i, 1);
        return;
      }
    }
    this.selectedUsers.push(user);
    this.idList.push(user.id);
  }

  addFriendsToGroup() {
    this.friendService.addFriendToGroup(this.idList).subscribe(
      (response) => {
        this.router.navigate(["/tabs/amigos"]);
        this.closeModal();
      },
      (error) => {
        console.error("Error al enviar la solicitud:", error);
      }
    );
  }

}
