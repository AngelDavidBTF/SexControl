import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-totals',
  templateUrl: './totals.component.html',
  styleUrls: ['./totals.component.scss'],
})
export class TotalsComponent implements OnInit {

  @Input() total: number;
  @Input() totalCompania: number;
  @Input() totalSolitario: number;
  @Input() mediaCompania: number;
  @Input() mediaSolitario: number;

  constructor() { }

  ngOnInit() {}

}
