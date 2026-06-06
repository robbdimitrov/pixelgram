import { HttpInterceptorFn } from '@angular/common/http';

export const headersInterceptor: HttpInterceptorFn = (req, next) => {
  if (isImageUpload(req) || !req.body) {
    return next(req);
  }
  const headers = {'content-type': 'application/json'};
  return next(req.clone({setHeaders: headers}));
};

function isImageUpload(req: Parameters<HttpInterceptorFn>[0]) {
  return req.method === 'POST' && req.url.includes('/uploads');
}
