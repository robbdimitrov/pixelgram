import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';

import {APIClient} from './api-client.service';
import {HttpCacheService} from './http-cache.service';
import {interceptors} from './interceptors';
import {Session} from './session.service';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    APIClient,
    HttpCacheService,
    interceptors,
    Session
  ]
})
export class ServicesModule {}
