import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SelectTimePageRoutingModule } from './select-time-routing.module';

import { SelectTimePage } from './select-time.page';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SelectTimePageRoutingModule,
    ComponentsModule
  ],
  declarations: [SelectTimePage]
})
export class SelectTimePageModule {}
