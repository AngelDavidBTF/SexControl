import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BackComponent } from './header/back.component';
import { TotalsComponent } from './totals/totals.component';
import { AnunciosComponent } from './anuncios/anuncios.component';





@NgModule({
  declarations: [
    BackComponent,
    TotalsComponent,
    AnunciosComponent
  ],
  exports: [
    BackComponent,
    TotalsComponent,
    AnunciosComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class ComponentsModule { }
