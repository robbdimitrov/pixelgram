import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {authGuard} from '../../shared/auth-guard.service';
import {SharedModule} from '../../shared/shared.module';
import {ImageUploadComponent} from './image-upload.component';

export const routes: Routes = [
  {
    path: 'upload',
    component: ImageUploadComponent,
    canActivate: [authGuard]
  },
  {
    path: 'upload/select',
    redirectTo: '/upload'
  },
  {
    path: 'upload/post',
    redirectTo: '/upload'
  }
];

@NgModule({
  declarations: [
    ImageUploadComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ImageUploadModule {}
