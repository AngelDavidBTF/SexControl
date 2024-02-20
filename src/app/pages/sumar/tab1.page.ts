import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../services/auth.service";
import { User } from "../../shared/user.interface";
import { Fap } from "../../shared/fap.interface";
import { FapService } from "../../services/fap.service";
import * as moment from "moment";
import { Subscription } from "rxjs";

@Component({
  selector: "app-tab1",
  templateUrl: "tab1.page.html",
  styleUrls: ["tab1.page.scss"],
})
export class Tab1Page {
  user: User = {
    uid: "",
    photoURL: "",
    displayName: "",
    email: "",
  };

  arrayColeccionFaps: any = [
    {
      id: "",
      data: {} as Fap,
    },
  ];

  fap: Fap;

  numeroFapSubscription: Subscription;

  numberC: number;
  numberS: number;
  numberTotal: number;

  constructor(
    private authService: AuthService,
    private fapService: FapService
  ) {
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        this.user = {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
        };

        const userToken = await user.getIdToken();
        this.authService.sendFirebaseTokenToLaravel(userToken);

        this.obtenerFap();
      }
    });
  }

  obtenerFap() {
  this.fapService.getNumeroFap(this.user.uid).subscribe(result => {
      this.arrayColeccionFaps = result.data;
      if (this.arrayColeccionFaps.length !== 0) {
        this.countFaps();
      } else {
        this.numberC = 0;
        this.numberS = 0;
        this.numberTotal = 0;
      }
    });
  }

  countFaps() {
    this.numberC = this.arrayColeccionFaps.filter(fap => !fap.solitario).length;
    this.numberS = this.arrayColeccionFaps.filter(fap => fap.solitario).length;
    this.numberTotal = this.arrayColeccionFaps.length;
  }

  sumar(tipo: boolean) {
    this.fap = {
      uid: this.user.uid,
      numero: 1,
      fecha: moment().format("DD/MM/YYYY HH:mm:ss"),
      solitario: tipo
    };

    this.numberC = !tipo ? this.numberC + 1 : this.numberC;
    this.numberS = tipo ? this.numberS + 1 : this.numberS;
    this.numberTotal = this.numberTotal + 1;

    this.fapService.insertarFap(this.fap).subscribe((response) => {
      this.arrayColeccionFaps.push(response.fap);
    },
      (error) => {
        console.error('Error al enviar la solicitud:', error);
        // Aquí puedes manejar cualquier error que ocurra durante la solicitud
      }
    );
  }

  borrar() {
    this.arrayColeccionFaps.sort((a, b) => {
      const date1 = moment(a.fecha, "DD/MM/YYYY HH:mm:ss").toDate();
      const date2 = moment(b.fecha, "DD/MM/YYYY HH:mm:ss").toDate();
      return moment(date1).diff(date2);
    });

    const lastId = this.arrayColeccionFaps[this.arrayColeccionFaps.length - 1].id;

    this.arrayColeccionFaps.pop();
    this.countFaps();

    this.fapService.borrarFap(lastId).subscribe(() => {

    }, error => {
      console.error(error);
    });
  }

  ngOnDestroy() {
    this.numeroFapSubscription.unsubscribe();
  }
}
