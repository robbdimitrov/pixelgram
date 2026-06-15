import {HttpInterceptorFn} from '@angular/common/http';

import {serverApiInterceptor} from './server-api-interceptor';
import {headersInterceptor} from './headers-interceptor';
import {errorInterceptor} from './error-interceptor';

export const interceptors: HttpInterceptorFn[] = [
  serverApiInterceptor,
  headersInterceptor,
  errorInterceptor
];
