import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {SettingsComponent} from './settings.component';
import {EditProfileComponent} from './edit-profile/edit-profile.component';
import {ChangePasswordComponent} from './change-password/change-password.component';
import {authGuard} from '../../shared/auth-guard.service';
import {SharedModule} from '../../shared/shared.module';

export const routes: Routes = [
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'settings/profile',
    component: EditProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'settings/password',
    component: ChangePasswordComponent,
    canActivate: [authGuard]
  }
];

@NgModule({
  declarations: [
    SettingsComponent,
    EditProfileComponent,
    ChangePasswordComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class SettingsModule {}
