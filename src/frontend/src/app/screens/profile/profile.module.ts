import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../shared/auth-guard.service';
import { SharedModule } from '../../shared/shared.module';
import { ProfileComponent } from './profile.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';
import { ThumbnailComponent } from './thumbnail/thumbnail.component';

export const routes: Routes = [
  {
    path: 'users/:userId',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'settings/account',
    component: EditProfileComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    ProfileComponent,
    EditProfileComponent,
    ProfileHeaderComponent,
    ThumbnailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ProfileModule {}
