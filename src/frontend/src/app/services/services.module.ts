import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { APIClient } from './api-client.service';
import { Session } from './session.service';
import { PlaceholderService } from './placeholder.service';
import { interceptorProviders } from './interceptors';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    APIClient,
    Session,
    PlaceholderService,
    interceptorProviders
  ]
})
export class ServicesModule {}
