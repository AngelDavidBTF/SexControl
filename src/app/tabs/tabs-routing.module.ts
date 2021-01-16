import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../shared/auth.guard';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'sumar',
        loadChildren: () => import('../pages/sumar/tab1.module').then(m => m.Tab1PageModule)
      },
      {
        path: 'amigos',
        loadChildren: () => import('../pages/amigos/tab2.module').then(m => m.Tab2PageModule)
      },
      {
        path: 'estadisticas',
        loadChildren: () => import('../pages/estadisticas/tab3.module').then(m => m.Tab3PageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/sumar',
        pathMatch: 'full'
      }
    ],
    canActivate: [AuthGuard],
  },
  {
    path: '',
    redirectTo: '/tabs/sumar',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
