import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {NotFoundComponent} from './not-found.component';
import {SharedModule} from '../../shared/shared.module';

export const routes: Routes = [
  {
    path: 'not-found',
    component: NotFoundComponent
  }
];

@NgModule({
  declarations: [
    NotFoundComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class NotFoundModule {}
