import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideClientHydration, withHttpTransferCacheOptions} from '@angular/platform-browser';

import {routes} from './app.routes';
import {interceptors} from './services/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors(interceptors)),
    provideAnimationsAsync(),
    provideClientHydration(
      withHttpTransferCacheOptions({includePostRequests: false, filter: (req) => req.method === 'GET'})
    )
  ]
};
