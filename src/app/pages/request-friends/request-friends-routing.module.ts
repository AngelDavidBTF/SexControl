import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RequestFriendsPage } from './request-friends.page';

const routes: Routes = [
  {
    path: '',
    component: RequestFriendsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequestFriendsPageRoutingModule {}
