import {ApplicationConfig, inject, provideAppInitializer} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideClientHydration, withHttpTransferCacheOptions} from '@angular/platform-browser';

import {routes} from './app.routes';
import {interceptors} from './services/interceptors';
import {SessionService} from './services/session.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors(interceptors)),
    provideAppInitializer(() => inject(SessionService).bootstrap()),
    provideAnimationsAsync(),
    provideClientHydration(
      withHttpTransferCacheOptions({includePostRequests: false, filter: (req) => req.method === 'GET'})
    )
  ]
};
