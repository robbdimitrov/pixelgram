import {Routes} from '@angular/router';

import {authGuard} from './shared/auth-guard.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/feed',
    pathMatch: 'full'
  },
  {
    path: 'feed',
    loadComponent: () => import('./screens/feed/feed.component').then((m) => m.FeedComponent),
    canActivate: [authGuard]
  },
  {
    path: 'posts/:postId',
    loadComponent: () => import('./screens/feed/feed.component').then((m) => m.FeedComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/:userId/likes',
    loadComponent: () => import('./screens/feed/feed.component').then((m) => m.FeedComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users/:userId',
    loadComponent: () => import('./screens/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'upload',
    loadComponent: () => import('./screens/image-upload/image-upload.component').then((m) => m.ImageUploadComponent),
    canActivate: [authGuard]
  },
  {
    path: 'upload/select',
    redirectTo: '/upload'
  },
  {
    path: 'upload/post',
    redirectTo: '/upload'
  },
  {
    path: 'settings',
    loadComponent: () => import('./screens/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings/profile',
    loadComponent: () => import('./screens/settings/edit-profile/edit-profile.component').then((m) => m.EditProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings/password',
    loadComponent: () => import('./screens/settings/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./screens/signup/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./screens/signup/signup.component').then((m) => m.SignupComponent)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./screens/not-found/not-found.component').then((m) => m.NotFoundComponent)
  },
  {
    path: '**',
    redirectTo: '/not-found'
  }
];
