import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ActionSheetController, AlertController, ModalController } from "@ionic/angular";
import { FriendsService } from "src/app/services/friends.service";
import { Fap } from "src/app/shared/fap.interface";
import { User } from '../../shared/user.interface';
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

  arrayColeccionFaps: any = [
    {
      id: "",
      data: {} as Fap,
    },
  ];

  currentUser: any;

  mediaGrupo: number;

  mediaCompania: number;
  mediaSolitario: number;

  textoBuscar = "";

  arraySolitario = [];
  arrayCompania = [];

  constructor(
    private friendService: FriendsService,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    public alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.group = this.friendService.actualGroup;
    this.currentUser = this.friendService.actualUidUser;
    this.getFriends();
  }

  onSearchChange(event: any) {
    this.textoBuscar = event.detail.value;
  }

  getFriends() {
    this.friendService.getFriendsByGroup(this.group).subscribe(
      (response) => {
        this.users = response.data;
        this.friendService.friendsInGroup = this.users;
        this.getFapFriends();
      },
      (error) => {
        console.error("Error al enviar la solicitud:", error);
      }
    );
  }

  getFapFriends() {
    this.friendService.getNumeroFapByGroup().subscribe(
      (response) => {
        this.arrayColeccionFaps = response.data;
        this.sortFriends();

      },
      (error) => {
        console.error("Error al enviar la solicitud:", error);
      }
    );
  }

  sortFriends(){

    this.users = this.users.map(user => {
        const reducedS = [];
        const reducedC = [];
    
        // Obtener un array de los valores del objeto this.arrayColeccionFaps
        const fapsArray = Object.values(this.arrayColeccionFaps);
    
        // Iterar sobre los valores del objeto this.arrayColeccionFaps
        fapsArray.forEach(array => {
            // Filtrar y mapear los elementos solitarios y de compañía
            const solitarios = (array as any[]).filter(elemento => elemento.solitario && elemento.user_id === user.id);
            const compania = (array as any[]).filter(elemento => !elemento.solitario && elemento.user_id === user.id);
    
            reducedS.push(...solitarios.map(element => ({ fap: element, id: element.user_id })));
            reducedC.push(...compania.map(element => ({ fap: element, id: element.user_id })));
    
            // Agregar las faps en solitario y en compañía a los arrays globales
            this.arraySolitario.push(...solitarios);
            this.arrayCompania.push(...compania);
        });
    
        // Agregamos la información de cada usuario
        user.solitario = reducedS;
        user.compania = reducedC;
    
        return user;
    });
          // Ordenamos los usuarios según el número total de faps
          this.users.sort((a, b) => (a.solitario.length + a.compania.length) < (b.solitario.length + b.compania.length) ? 1 : -1);

          // Calculamos las medias
          const totalUsers = this.users.length;
          this.mediaGrupo = (this.arraySolitario.length + this.arrayCompania.length) / totalUsers;
          this.mediaSolitario = this.arraySolitario.length / totalUsers;
          this.mediaCompania = this.arrayCompania.length / totalUsers;
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
      this.friendService.deleteFriendInGroup(user).subscribe(
        (response) => {
          this.friendService.friendsInGroup = this.friendService.friendsInGroup.filter(friend => friend.id !== user);
          delete this.arrayColeccionFaps[user];
          this.arraySolitario = [];
          this.arrayCompania = [];
          this.users = this.friendService.friendsInGroup;
          this.sortFriends();
        },
        (error) => {
          console.error("Error al enviar la solicitud:", error);
        }
      );
  }

  showAlert() {
    this.presentActionSheet();
  }

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Eliminar grupo',
      subHeader: '¿Estás seguro de eliminar el grupo?',
      message: 'Está opción no es reversible.',
      buttons: [{
        text: 'Sí, eliminar',
        cssClass: 'red',
        handler: () => {
          this.deleteGroup();
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }]
    });

    await alert.present();
  }

  deleteGroup() {
    this.friendService.deleteGroup(this.group.id).subscribe(
      (response) => {
        this.router.navigate(["/tabs/amigos"]);
      },
      (error) => {
        console.error("Error al enviar la solicitud:", error);
      }
    );
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
          text: "Eliminar grupo",
          icon: "close",
          role: "destructive",
          cssClass: "red",
          handler: () => {
            this.presentAlert();
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
