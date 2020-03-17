import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { APIClient } from './api-client.service';
import { ErrorService } from './error.service';
import { Session } from './session.service';
import { PlaceholderService } from './placeholder.service';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    APIClient,
    ErrorService,
    Session,
    PlaceholderService
  ]
})
export class ServicesModule {}
