import { Component, OnInit } from '@angular/core';
import * as moment from "moment";
import { StadisticsService } from 'src/app/services/stadistics.service';

@Component({
  selector: 'app-select-time',
  templateUrl: './select-time.page.html',
  styleUrls: ['./select-time.page.scss'],
})
export class SelectTimePage {

  fechaActual: any = moment().format("YYYY-MM-DD");
  fechaInicio: any;
  fechaFin: any;
  faps: any;
  fapsFiltered = [];

  arraySolitario = [];
  arrayCompania = [];
  mediaTotal: number;
  mediaSolitario: number;
  mediaCompania: number;

  constructor(private stadisticsService: StadisticsService) { 
    this.getFaps();
  }

  getFaps() {
    this.faps = this.stadisticsService.fapsUser;
  }

  filtrar() {
    this.fapsFiltered = [];

    let fechaInicio = moment(this.fechaInicio).format('YYYY-MM-DD');
    let fechaFin = moment(this.fechaFin).format('YYYY-MM-DD');

    this.fapsFiltered = this.faps.filter((fap) => {
      let fechaFap = moment(fap.fecha, "YYYY/MM/DD HH:mm:ss").format('YYYY-MM-DD');
      if (moment(fechaFap).isBetween(fechaInicio, fechaFin, "h", "[]")) {
        return fap;
      }
    });
    
    this.fapsFiltered = this.fapsFiltered.sort((a: any, b: any) => {
      const date1 = moment(a.fecha, "YYYY/MM/DD HH:mm:ss").toDate();
      const date2 = moment(b.fecha, "YYYY/MM/DD HH:mm:ss").toDate();
      return moment(date2).diff(date1);
    });

    this.arraySolitario = [];
      this.arrayCompania = [];
      this.fapsFiltered.forEach((element: any) => {
        if (element.solitario === 1) {
          this.arraySolitario.push(element);
        } else {
          this.arrayCompania.push(element);
        }
      });

      this.mediaSolitario = (this.arraySolitario.length / this.fapsFiltered.length) * 100;
      this.mediaCompania = (this.arrayCompania.length / this.fapsFiltered.length) * 100;
  }

}
