import {inject, PLATFORM_ID, REQUEST} from '@angular/core';
import {HttpInterceptorFn} from '@angular/common/http';
import {isPlatformServer} from '@angular/common';

import {BACKEND_URL} from '../tokens';

export const serverApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformServer(inject(PLATFORM_ID))) {
    return next(req);
  }

  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const backendUrl = inject(BACKEND_URL);
  const incomingRequest = inject(REQUEST, {optional: true});

  const backendPath = req.url.replace(/^\/api/, '');
  const absoluteUrl = `${backendUrl}${backendPath}`;

  let serverReq = req.clone({url: absoluteUrl});

  const cookie = incomingRequest?.headers.get('cookie');
  if (cookie) {
    serverReq = serverReq.clone({setHeaders: {Cookie: cookie}});
  }

  return next(serverReq);
};
