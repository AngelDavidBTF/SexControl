import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditGroupPageRoutingModule } from './edit-group-routing.module';

import { EditGroupPage } from './edit-group.page';
import { ComponentsModule } from '../../components/components.module';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditGroupPageRoutingModule,
    ComponentsModule,
    PipesModule
  ],
  declarations: [EditGroupPage]
})
export class EditGroupPageModule {}
