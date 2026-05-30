import {NgModule} from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import {APIClient} from './api-client.service';
import {HttpCacheService} from './http-cache.service';
import {interceptors} from './interceptors';
import {Session} from './session.service';

@NgModule({ imports: [], providers: [
        APIClient,
        HttpCacheService,
        interceptors,
        Session,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class ServicesModule {}
