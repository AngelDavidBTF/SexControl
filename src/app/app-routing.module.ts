import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./pages/forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule)
  },
  {
    path: 'verify-email',
    loadChildren: () => import('./pages/verify-email/verify-email.module').then(m => m.VerifyEmailPageModule)
  },
  {
    path: 'add-friend',
    loadChildren: () => import('./pages/add-friend/add-friend.module').then( m => m.AddFriendPageModule)
  },
  {
    path: 'request-friends',
    loadChildren: () => import('./pages/request-friends/request-friends.module').then( m => m.RequestFriendsPageModule)
  },
  {
    path: 'create-group',
    loadChildren: () => import('./pages/create-group/create-group.module').then( m => m.CreateGroupPageModule)
  },
  {
    path: 'edit-group',
    loadChildren: () => import('./pages/edit-group/edit-group.module').then( m => m.EditGroupPageModule)
  },
  {
    path: 'general',
    loadChildren: () => import('./pages/statistics/general/general.module').then( m => m.GeneralPageModule)
  },
  {
    path: 'day',
    loadChildren: () => import('./pages/statistics/day/day.module').then( m => m.DayPageModule)
  },
  {
    path: 'week',
    loadChildren: () => import('./pages/statistics/week/week.module').then( m => m.WeekPageModule)
  },
  {
    path: 'month',
    loadChildren: () => import('./pages/statistics/month/month.module').then( m => m.MonthPageModule)
  },
  {
    path: 'year',
    loadChildren: () => import('./pages/statistics/year/year.module').then( m => m.YearPageModule)
  },
  {
    path: 'select-time',
    loadChildren: () => import('./pages/statistics/select-time/select-time.module').then( m => m.SelectTimePageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
