import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { HeaderComponent } from './components/header/header.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ToastComponent } from './components/toast/toast.component';
import { ImagePipe } from './pipes/image.pipe';
import { UserPipe } from './pipes/user.pipe';
import { AuthGuard } from './auth-guard.service';
import { RelativeDatePipe } from './pipes/relative-date.pipe';
import { IconLibrary } from './icon-library.service';

@NgModule({
  declarations: [
    HeaderComponent,
    NotFoundComponent,
    ToastComponent,
    ImagePipe,
    UserPipe,
    RelativeDatePipe
  ],
  providers: [
    AuthGuard,
    IconLibrary
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FontAwesomeModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FontAwesomeModule,
    HeaderComponent,
    NotFoundComponent,
    ToastComponent,
    ImagePipe,
    UserPipe,
    RelativeDatePipe
  ]
})
export class SharedModule {}
