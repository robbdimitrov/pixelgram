import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../shared/auth-guard.service';
import { SharedModule } from '../../shared/shared.module';
import { ImageUploadComponent } from './image-upload.component';
import { ImageCreateComponent } from './image-create/image-create.component';
import { ImageUploadService } from './image-upload.service';

export const routes: Routes = [
  {
    path: 'upload/select',
    component: ImageUploadComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'upload/post',
    component: ImageCreateComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'upload',
    redirectTo: '/upload/select'
  },
];

@NgModule({
  declarations: [
    ImageUploadComponent,
    ImageCreateComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    ImageUploadService
  ]
})
export class ImageUploadModule {}
