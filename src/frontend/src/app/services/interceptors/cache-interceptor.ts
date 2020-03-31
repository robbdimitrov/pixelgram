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
    return this.sendCache(req.url) || this.sendRequest(req, next);
  }

  private sendCache(url: string) {
    const response = this.cache.get(url);
    if (response instanceof HttpResponse) {
      return of(response);
    }
    return response;
  }

  private sendRequest(req: HttpRequest<any>, next: HttpHandler) {
    const result = next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.url, event);
        }
      }),
      share()
    );
    this.cache.set(req.url, result);
    return result;
  }
}

function isCacheable(req: HttpRequest<any>) {
  const re = /\/users\/\d+$/;
  return req.method === 'GET' && re.test(req.url);
}
