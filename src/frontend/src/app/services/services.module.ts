import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { APIClient } from './api-client.service';
import { CacheService } from './cache.service';
import { interceptors } from './interceptors';
import { Session } from './session.service';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    APIClient,
    CacheService,
    interceptors,
    Session
  ]
})
export class ServicesModule {}
