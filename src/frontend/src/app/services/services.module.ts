import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { APIClient } from './api-client.service';
import { Session } from './session.service';
import { interceptorProviders } from './interceptors';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    APIClient,
    Session,
    interceptorProviders
  ]
})
export class ServicesModule {}
