import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  constructor(private router: Router) {}

  chargeView(view: any) {
    if (view === 'general') {
      this.router.navigate(["general"]);
    } else if (view === 'day') {
      this.router.navigate(["day"]);
    } else if (view === 'week') {
      this.router.navigate(["week"]);
    } else if (view === 'month') {
      this.router.navigate(["month"]);
    } else if (view === 'year') {
      this.router.navigate(["year"]);
    } else if (view === 'select') {
      this.router.navigate(["select-time"]);
    }
  }

}
