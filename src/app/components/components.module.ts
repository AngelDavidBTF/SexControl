import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BackComponent } from './header/back.component';
import { TotalsComponent } from './totals/totals.component';





@NgModule({
  declarations: [
    BackComponent,
    TotalsComponent
  ],
  exports: [
    BackComponent,
    TotalsComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class ComponentsModule { }
