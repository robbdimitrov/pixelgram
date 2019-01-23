import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { SignupComponent } from './signup.component';
import { NotAuthGuard } from '../../shared/services/not-auth-guard.service';

export const routes: Routes = [
    {
        path: 'signup',
        component: SignupComponent,
        canActivate: [NotAuthGuard]
    },
];

@NgModule({
    declarations: [
        SignupComponent
    ],
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ]
})
export class SignupModule {}
