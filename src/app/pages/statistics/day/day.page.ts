import { Component, OnInit } from "@angular/core";
import { StadisticsService } from "src/app/services/stadistics.service";
import * as moment from "moment";

@Component({
  selector: "app-day",
  templateUrl: "./day.page.html",
  styleUrls: ["./day.page.scss"],
})
export class DayPage {
  faps = [];
  arraySolitario = [];
  arrayCompania = [];
  mediaTotal: number;
  mediaSolitario: number;
  mediaCompania: number;

  today = moment().startOf("day");

  constructor(private stadisticsService: StadisticsService) {
    this.getFaps();
  }

  getFaps() {
    this.stadisticsService.getFaps().subscribe((result) => {
      this.faps = result;

      this.faps = this.faps.filter((fap) => {
        if (
          moment(fap.data.fecha, "DD/MM/YYYY HH:mm:ss").isSame(this.today, "d")
        ) {
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

      this.mediaSolitario =
        (this.arraySolitario.length / this.faps.length) * 100;
      this.mediaCompania = (this.arrayCompania.length / this.faps.length) * 100;
    });
  }
}
