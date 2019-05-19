import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";

import { FormComponent } from "./components/form/form.component";
import { HeaderComponent } from "./components/header/header.component";
import { NotFoundComponent } from "./components/not-found/not-found.component";
import { ToastComponent } from "./components/toast/toast.component";
import { ImagePipe } from "./pipes/image.pipe";
import { UserPipe } from "./pipes/user.pipe";
import { AuthGuard } from "./guards/auth-guard.service";
import { NotAuthGuard } from "./guards/not-auth-guard.service";
import { RelativeDatePipe } from "./pipes/relative-date.pipe";

@NgModule({
    declarations: [
        FormComponent,
        HeaderComponent,
        NotFoundComponent,
        ToastComponent,
        ImagePipe,
        UserPipe,
        RelativeDatePipe
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
        UserPipe,
        RelativeDatePipe
    ]
})
export class SharedModule {}
