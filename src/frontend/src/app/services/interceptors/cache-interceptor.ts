import { HttpInterceptorFn, HttpResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { HttpCacheService } from '../http-cache.service';

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isCacheable(req)) {
    return next(req);
  }
  const cache = inject(HttpCacheService);
  return sendCache(cache, req.url) ?? sendRequest(cache, req, next);
};

function sendCache(cache: HttpCacheService, url: string): Observable<HttpEvent<unknown>> | null {
  const cached = cache.get(url);
  if (cached instanceof HttpResponse) {
    return of(cached);
  }
  return cached ?? null;
}

function sendRequest(
  cache: HttpCacheService,
  req: Parameters<HttpInterceptorFn>[0],
  next: Parameters<HttpInterceptorFn>[1]
): Observable<HttpEvent<unknown>> {
  const result = next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(req.url, event);
      }
    })
  );
  cache.set(req.url, result);
  return result;
}

function isCacheable(req: Parameters<HttpInterceptorFn>[0]) {
  const re = /\/users\/\d+$/;
  return req.method === 'GET' && re.test(req.url);
}
