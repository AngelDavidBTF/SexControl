import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BackComponent } from './back/back.component';





@NgModule({
  declarations: [
    BackComponent
  ],
  exports: [
    BackComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class ComponentsModule { }
