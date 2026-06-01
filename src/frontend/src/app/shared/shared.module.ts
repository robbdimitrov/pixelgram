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
  LucideTriangleAlert,
  LucideTrash2
} from '@lucide/angular';

import {NavbarComponent} from './components/navbar.component';
import {EmptyStateComponent} from './components/empty-state.component';
import {ImagePipe} from './pipes/image.pipe';
import {UserPipe} from './pipes/user.pipe';
import {RelativeDatePipe} from './pipes/relative-date.pipe';
import {PluralizePipe} from './pipes/pluralize.pipe';
import {
  FormInputStyleDirective,
  FormTextareaStyleDirective,
  PrimaryActionStyleDirective
} from './directives/form-control-style.directive';
import {TrimDirective} from './directives/trim.directive';

@NgModule({
  declarations: [
    NavbarComponent,
    EmptyStateComponent,
    ImagePipe,
    UserPipe,
    RelativeDatePipe,
    PluralizePipe,
    FormInputStyleDirective,
    FormTextareaStyleDirective,
    PrimaryActionStyleDirective,
    TrimDirective
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
    LucideTriangleAlert,
    LucideTrash2
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
    LucideTrash2,
    NavbarComponent,
    EmptyStateComponent,
    ImagePipe,
    UserPipe,
    RelativeDatePipe,
    PluralizePipe,
    FormInputStyleDirective,
    FormTextareaStyleDirective,
    PrimaryActionStyleDirective,
    TrimDirective
  ]
})
export class SharedModule {}
