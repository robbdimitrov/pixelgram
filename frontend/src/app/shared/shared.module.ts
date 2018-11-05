import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { FormComponent } from './components/form/form.component';
import { HeaderComponent } from './components/header/header.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ToastComponent } from './components/toast/toast.component';
import { ImagePipe } from './pipes/image.pipe';
import { MomentPipe } from './pipes/moment.pipe';
import { UserPipe } from './pipes/user.pipe';
import { AuthGuard } from './services/auth-guard.service';
import { NotAuthGuard } from './services/not-auth-guard.service';

@NgModule({
    declarations: [
        FormComponent,
        HeaderComponent,
        NotFoundComponent,
        ToastComponent,
        ImagePipe,
        MomentPipe,
        UserPipe
    ],
    providers: [
        AuthGuard,
        NotAuthGuard
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule
    ],
    exports: [
        CommonModule,
        FormsModule,
        RouterModule,
        FormComponent,
        HeaderComponent,
        NotFoundComponent,
        ToastComponent,
        ImagePipe,
        MomentPipe,
        UserPipe
    ]
})
export class SharedModule {}
