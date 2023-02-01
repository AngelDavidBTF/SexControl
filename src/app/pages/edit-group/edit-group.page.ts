import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
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
    public alertController: AlertController
  ) {}

  ngOnInit() {
    this.group = this.friendService.actualGroup;
    this.currentUser = this.friendService.actualUidUser;
    this.getFriends();
    this.getFapFriends();
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

  /*getFapFriends() {
    this.friendService.getNumeroFapByGroup().subscribe((result) => {
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

      
      this.users.forEach((element: any, i: number ) => {
        var reducedS = this.arrayColeccionFaps.reduce(function(filtered, option) {
          if (option.data.uid === element.data.uid) {
            if(option.data.solitario === true) {
              var someNewValue = { fap: option.data, uid: option.data.uid }
              filtered.push(someNewValue);
            }
          }
          return filtered;
        }, []);
        var reducedC = this.arrayColeccionFaps.reduce(function(filtered, option) {
          if (option.data.uid === element.data.uid) {
            if(option.data.solitario === false) {
              var someNewValue = { fap: option.data, uid: option.data.uid }
              filtered.push(someNewValue);
            }
          }
          return filtered;
        }, []);
        this.users[i].solitario =  reducedS;
        this.users[i].compania =  reducedC;
      });

      this.users = this.users.sort((a: any, b: any) => {
        const totalS1 = a.solitario.length;
        const totalS2 = b.solitario.length;
        const totalC1 = a.compania.length;
        const totalC2 = b.compania.length;
        const total1 = totalS1 + totalC1;
        const total2 = totalS2 + totalC2;
        return total2 - total1;
      });
      
      let totalUsers = this.users.length;
      this.mediaGrupo = this.arrayColeccionFaps.length / totalUsers;
      
      this.mediaSolitario = this.arraySolitario.length / totalUsers;
      this.mediaCompania = this.arrayCompania.length / totalUsers;
      
    });
  } */

  getFapFriends() {
    this.friendService.getNumeroFapByGroup().subscribe((result) => {
      // Transformamos la respuesta en un arreglo de objetos
      this.arrayColeccionFaps = result.map(datosFap => ({
        id: datosFap.payload.doc.id,
        data: datosFap.payload.doc.data()
      }));
  
      // Filtrar y mapear los elementos solitarios y de compañía
      this.arraySolitario = this.arrayColeccionFaps
        .filter(element => element.data.solitario === true)
        .map(element => ({ user: element.data.uid, fap: element }));
  
      this.arrayCompania = this.arrayColeccionFaps
        .filter(element => element.data.solitario === false)
        .map(element => ({ user: element.data.uid, faps: element }));
  
      // Procesamos los datos de cada usuario
      this.users = this.users.map(user => {
        const reducedS = this.arrayColeccionFaps
          .filter(element => element.data.uid === user.data.uid && element.data.solitario === true)
          .map(element => ({ fap: element.data, uid: element.data.uid }));
  
        const reducedC = this.arrayColeccionFaps
          .filter(element => element.data.uid === user.data.uid && element.data.solitario === false)
          .map(element => ({ fap: element.data, uid: element.data.uid }));
  
        return { ...user, solitario: reducedS, compania: reducedC };
      });
  
      // Ordenamos los usuarios según el número total de faps
      this.users.sort((a, b) => (a.solitario.length + a.compania.length) < (b.solitario.length + b.compania.length) ? 1 : -1);
  
      // Calculamos las medias
      const totalUsers = this.users.length;
      this.mediaGrupo = this.arrayColeccionFaps.length / totalUsers;
      this.mediaSolitario = this.arraySolitario.length / totalUsers;
      this.mediaCompania = this.arrayCompania.length / totalUsers;
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
    this.friendService.deleteGroup(this.group.id);
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
