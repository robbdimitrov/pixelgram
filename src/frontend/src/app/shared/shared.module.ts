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
  LucideMonitor,
  LucideArrowLeft,
  LucideTriangleAlert
} from '@lucide/angular';

import {NavbarComponent} from './components/navbar.component';
import {ImagePipe} from './pipes/image.pipe';
import {UserPipe} from './pipes/user.pipe';
import {RelativeDatePipe} from './pipes/relative-date.pipe';
import {
  FormInputStyleDirective,
  FormTextareaStyleDirective,
  PrimaryActionStyleDirective
} from './directives/form-control-style.directive';

@NgModule({
  declarations: [
    NavbarComponent,
    ImagePipe,
    UserPipe,
    RelativeDatePipe,
    FormInputStyleDirective,
    FormTextareaStyleDirective,
    PrimaryActionStyleDirective
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
    LucideMonitor,
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
    LucideMonitor,
    LucideArrowLeft,
    LucideTriangleAlert,
    NavbarComponent,
    ImagePipe,
    UserPipe,
    RelativeDatePipe,
    FormInputStyleDirective,
    FormTextareaStyleDirective,
    PrimaryActionStyleDirective
  ]
})
export class SharedModule {}
