import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RequestFriendsPageRoutingModule } from './request-friends-routing.module';

import { RequestFriendsPage } from './request-friends.page';
import { ComponentsModule } from '../../components/components.module';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RequestFriendsPageRoutingModule,
    ComponentsModule,
    PipesModule
  ],
  declarations: [RequestFriendsPage]
})
export class RequestFriendsPageModule {}
