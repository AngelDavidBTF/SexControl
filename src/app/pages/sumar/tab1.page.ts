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
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.user = {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
        };

        this.obtenerFap();
      }
    });
  }

  obtenerFap() {
    this.numeroFapSubscription = this.fapService
      .getNumeroFap(this.user.uid)
      .subscribe((result) => {
        // todos los datos
        this.arrayColeccionFaps = [];
        result.forEach((datosFap: any) => {
          this.arrayColeccionFaps.push({
            id: datosFap.payload.doc.id,
            data: datosFap.payload.doc.data(),
          });
        });

        this.numberC = 0;
        this.numberS = 0;
        this.numberTotal = 0;
        for (const fap of this.arrayColeccionFaps) {
          if (fap.data.solitario === true) {
            this.numberS++;
          } else {
            this.numberC++;
          }
          this.numberTotal++;
        }
      });
  }

  sumar(tipo: boolean) {
    this.fap = {
      uid: this.user.uid,
      numero: 1,
      fecha: moment().format("DD/MM/YYYY HH:mm:ss"),
      solitario: tipo,
    };

    this.fapService.insertarFap(this.fap).then(
      () => {
        this.fap = {} as Fap;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  borrar() {
    this.arrayColeccionFaps = this.arrayColeccionFaps.sort((a: any, b: any) => {
      const date1 = moment(a.data.fecha, "DD/MM/YYYY HH:mm:ss").toDate();
      const date2 = moment(b.data.fecha, "DD/MM/YYYY HH:mm:ss").toDate();
      return moment(date1).diff(date2);
    });
    const lastId = this.arrayColeccionFaps[this.arrayColeccionFaps.length - 1]
      .id;
    this.fapService.borrarFap(lastId).then(() => {
      // Actualizar la lista completa
      this.obtenerFap();
    });
  }

  ngOnDestroy() {
    this.numeroFapSubscription.unsubscribe();
  }
}
