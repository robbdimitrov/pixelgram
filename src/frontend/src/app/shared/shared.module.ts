import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {
  LucideHome,
  LucideCamera,
  LucideUser,
  LucideSettings,
  LucideHeart,
  LucideChevronDown,
  LucideChevronRight,
  LucideSquarePlus,
  LucideSun,
  LucideMoon,
  LucideArrowLeft,
  LucideTriangleAlert
} from '@lucide/angular';

import {NavbarComponent} from './components/navbar.component';
import {ImagePipe} from './pipes/image.pipe';
import {UserPipe} from './pipes/user.pipe';
import {RelativeDatePipe} from './pipes/relative-date.pipe';

@NgModule({
  declarations: [
    NavbarComponent,
    ImagePipe,
    UserPipe,
    RelativeDatePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideHome,
    LucideCamera,
    LucideUser,
    LucideSettings,
    LucideHeart,
    LucideChevronDown,
    LucideChevronRight,
    LucideSquarePlus,
    LucideSun,
    LucideMoon,
    LucideArrowLeft,
    LucideTriangleAlert
  ],
  exports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideHome,
    LucideCamera,
    LucideUser,
    LucideSettings,
    LucideHeart,
    LucideChevronDown,
    LucideChevronRight,
    LucideSquarePlus,
    LucideSun,
    LucideMoon,
    LucideArrowLeft,
    LucideTriangleAlert,
    NavbarComponent,
    ImagePipe,
    UserPipe,
    RelativeDatePipe
  ]
})
export class SharedModule {}
