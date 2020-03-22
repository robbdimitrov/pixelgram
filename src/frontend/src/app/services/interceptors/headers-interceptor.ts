import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    console.log(`req = ${req.url} headers = ${req.headers}`);

    if (!req.headers.get('content-type')) {
      const headers = { 'content-type': 'application/json' };
      const result = req.clone({ setHeaders: headers });
      return next.handle(result);
    }
    return next.handle(req);
  }
}
