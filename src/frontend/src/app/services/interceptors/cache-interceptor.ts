import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpResponse, HttpEvent
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {share} from 'rxjs/operators';
import {Observable, of} from 'rxjs';

import {HttpCacheService} from '../http-cache.service';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  constructor(private cache: HttpCacheService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!isCacheable(req)) {
      return next.handle(req);
    }
    return this.sendCache(req.url) || this.sendRequest(req, next);
  }

  private sendCache(url: string) {
    const response = this.cache.get(url);
    if (response instanceof HttpResponse<any>) {
      return of(response);
    }
    return response;
  }

  private sendRequest(req: HttpRequest<any>, next: HttpHandler) {
    const result = next.handle(req).pipe(share());
    this.cache.set(req.url, result);
    return result;
  }
}

function isCacheable(req: HttpRequest<any>) {
  const re = /\/users\/\d+$/;
  return req.method === 'GET' && re.test(req.url);
}
