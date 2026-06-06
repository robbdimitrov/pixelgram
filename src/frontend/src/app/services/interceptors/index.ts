import { HttpInterceptorFn } from '@angular/common/http';

import { errorInterceptor } from './error-interceptor';
import { headersInterceptor } from './headers-interceptor';

export const interceptors: HttpInterceptorFn[] = [
  headersInterceptor,
  errorInterceptor
];
