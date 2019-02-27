import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../shared/guards/auth-guard.service';
import { SharedModule } from '../../shared/shared.module';
import { ImageUploadService } from './image-upload.service';
import { ImageUploadComponent } from './image-upload.component';
import { PostCreateComponent } from './post-create/post-create.component';

export const routes: Routes = [
    {
        path: 'upload/select',
        component: ImageUploadComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'upload/post',
        component: PostCreateComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'upload',
        redirectTo: '/upload/select',
        pathMatch: 'full'
    },
];

@NgModule({
    declarations: [
        ImageUploadComponent,
        PostCreateComponent
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
