import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectTimePage } from './select-time.page';

const routes: Routes = [
  {
    path: '',
    component: SelectTimePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectTimePageRoutingModule {}
