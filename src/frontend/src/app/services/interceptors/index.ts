import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { CacheInterceptor } from './cache-interceptor';
import { ErrorInterceptor } from './error-interceptor';
import { HeaderInterceptor } from './headers-interceptor';

export const interceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: HeaderInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
];
