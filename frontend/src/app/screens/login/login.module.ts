import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './login.component';
import { NotAuthGuard } from '../../shared/guards/not-auth-guard.service';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [NotAuthGuard]
    }
];

@NgModule({
    declarations: [
        LoginComponent
    ],
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ]
})
export class LoginModule {}
