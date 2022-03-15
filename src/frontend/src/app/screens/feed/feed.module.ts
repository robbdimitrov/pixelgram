import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '../../shared/auth-guard.service';
import {FeedComponent} from './feed.component';
import {ImageComponent} from './image/image.component';
import {SharedModule} from '../../shared/shared.module';

export const routes: Routes = [
  {
    path: 'feed',
    component: FeedComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'images/:imageId',
    component: FeedComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users/:userId/likes',
    component: FeedComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    FeedComponent,
    ImageComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class FeedModule {}
