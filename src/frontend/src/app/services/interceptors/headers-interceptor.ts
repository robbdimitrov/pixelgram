import {HttpInterceptor, HttpRequest, HttpHandler} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (isImageUpload(req) || !req.body) {
      return next.handle(req);
    }
    const headers = {'content-type': 'application/json'};
    const result = req.clone({setHeaders: headers});
    return next.handle(result);
  }
}

function isImageUpload(req: HttpRequest<any>) {
  return req.method === 'POST' && req.url.includes('/uploads');
}
