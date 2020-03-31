import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, share, startWith } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, any>();

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (!isCacheable(req)) {
      return next.handle(req);
    }
    const cachedResponse = this.cache.get(req.urlWithParams);
    return cachedResponse ? of(cachedResponse) : this.sendRequest(req, next);
  }

  private sendRequest(req: HttpRequest<any>, next: HttpHandler) {
    const result = next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.urlWithParams, event.body);
        }
      }),
      share()
    );
    this.cache.set(req.urlWithParams, result);
    return result;
  }
}

function isCacheable(req: HttpRequest<any>) {
  return req.method === 'GET' && req.url.includes('/users/');
}
