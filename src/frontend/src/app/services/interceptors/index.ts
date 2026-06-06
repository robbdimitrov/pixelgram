import { HttpInterceptorFn } from '@angular/common/http';

import { cacheInterceptor } from './cache-interceptor';
import { errorInterceptor } from './error-interceptor';
import { headersInterceptor } from './headers-interceptor';

export const interceptors: HttpInterceptorFn[] = [
  cacheInterceptor,
  headersInterceptor,
  errorInterceptor
];
