import { Routes } from '@angular/router';
import { authGuard, signedInGuard } from './shared/auth.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'sumar',
        loadComponent: () => import('./pages/sumar/sumar.page').then((m) => m.SumarPage),
      },
      {
        path: 'amigos',
        loadComponent: () => import('./pages/amigos/amigos.page').then((m) => m.AmigosPage),
      },
      {
        path: 'estadisticas',
        loadComponent: () => import('./pages/estadisticas/estadisticas.page').then((m) => m.EstadisticasPage),
      },
      {
        path: '',
        redirectTo: 'sumar',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'add-friend',
    loadComponent: () => import('./pages/add-friend/add-friend.page').then((m) => m.AddFriendPage),
    canActivate: [authGuard],
  },
  {
    path: 'request-friends',
    loadComponent: () => import('./pages/request-friends/request-friends.page').then((m) => m.RequestFriendsPage),
    canActivate: [authGuard],
  },
  {
    path: 'create-group',
    loadComponent: () => import('./pages/create-group/create-group.page').then((m) => m.CreateGroupPage),
    canActivate: [authGuard],
  },
  {
    path: 'group/:id',
    loadComponent: () => import('./pages/group/group.page').then((m) => m.GroupPage),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email.page').then((m) => m.VerifyEmailPage),
    canActivate: [signedInGuard],
  },
  // Invitaciones por enlace o QR (piden sesión: el guard lleva al login y se vuelve aquí).
  {
    path: 'invitar/:uid',
    loadComponent: () => import('./pages/invite/invite.page').then((m) => m.InvitePage),
    canActivate: [authGuard],
  },
  {
    path: 'unirse/:code',
    loadComponent: () => import('./pages/join-group/join-group.page').then((m) => m.JoinGroupPage),
    canActivate: [authGuard],
  },
  {
    path: 'ajustes',
    loadComponent: () => import('./pages/ajustes/ajustes.page').then((m) => m.AjustesPage),
    canActivate: [authGuard],
  },
];
