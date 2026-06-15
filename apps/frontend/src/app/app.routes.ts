import {Routes, UrlMatchResult, UrlSegment} from '@angular/router';

import {authGuard} from './shared/auth-guard.service';

const usernamePattern = /^[a-z0-9._]{3,30}$/;

export function profileLikesMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length !== 2 || segments[1].path !== 'likes') {
    return null;
  }
  const username = segments[0].path.startsWith('@') ? segments[0].path.slice(1) : '';
  return usernamePattern.test(username)
    ? {consumed: segments, posParams: {username: new UrlSegment(username, {})}}
    : null;
}

export function profileMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length !== 1) {
    return null;
  }
  const username = segments[0].path.startsWith('@') ? segments[0].path.slice(1) : '';
  return usernamePattern.test(username)
    ? {consumed: segments, posParams: {username: new UrlSegment(username, {})}}
    : null;
}

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
    path: 'posts/:publicId',
    loadComponent: () => import('./screens/feed/feed.component').then((m) => m.FeedComponent),
    canActivate: [authGuard]
  },
  {
    matcher: profileLikesMatcher,
    loadComponent: () => import('./screens/feed/feed.component').then((m) => m.FeedComponent),
    canActivate: [authGuard]
  },
  {
    matcher: profileMatcher,
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
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./screens/settings/settings.component').then((m) => m.SettingsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./screens/settings/edit-profile/edit-profile.component').then((m) => m.EditProfileComponent)
      },
      {
        path: 'password',
        loadComponent: () => import('./screens/settings/change-password/change-password.component').then((m) => m.ChangePasswordComponent)
      }
    ]
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
