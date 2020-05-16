import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsComponent } from './settings.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AuthGuard } from '../../shared/auth-guard.service';
import { SharedModule } from '../../shared/shared.module';

export const routes: Routes = [
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'settings/password',
    component: ChangePasswordComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    SettingsComponent,
    ChangePasswordComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class SettingsModule {}
