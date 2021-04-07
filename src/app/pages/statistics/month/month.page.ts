import { Component, OnInit } from '@angular/core';
import * as moment from "moment";
import { StadisticsService } from 'src/app/services/stadistics.service';

@Component({
  selector: 'app-month',
  templateUrl: './month.page.html',
  styleUrls: ['./month.page.scss'],
})
export class MonthPage {

  faps = [];
  arraySolitario = [];
  arrayCompania = [];
  mediaTotal: number;
  mediaSolitario: number;
  mediaCompania: number;

  constructor(private stadisticsService: StadisticsService) { 
    this.getFaps();
  }

  getFaps() {
    this.stadisticsService.getFaps().subscribe((result) => {
      this.faps = result;

      var monthActual = moment().month();
      var yearActual = moment().year();
      
      this.faps = this.faps.filter((fap) => {
        var monthNumber = moment(fap.data.fecha, "DD/MM/YYYY HH:mm:ss").month();
        var yearNumber = moment(fap.data.fecha, "DD/MM/YYYY HH:mm:ss").year();
        if ((monthNumber === monthActual) && (yearActual === yearNumber)) {
          return fap;
        }
      });
      
      this.faps = this.faps.sort((a: any, b: any) => {
        const date1 = moment(a.data.fecha, "DD/MM/YYYY HH:mm:ss").toDate();
        const date2 = moment(b.data.fecha, "DD/MM/YYYY HH:mm:ss").toDate();
        return moment(date2).diff(date1);
      });

      this.arraySolitario = [];
      this.arrayCompania = [];
      this.faps.forEach((element: any) => {
        if (element.data.solitario === true) {
          this.arraySolitario.push(element);
        } else {
          this.arrayCompania.push(element);
        }
      });

      this.mediaSolitario = (this.arraySolitario.length / this.faps.length) * 100;
      this.mediaCompania = (this.arrayCompania.length / this.faps.length) * 100;
    });
  }

}
