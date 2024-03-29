import {Injectable} from '@angular/core';
import {
  HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import {Router} from '@angular/router';
import {catchError} from 'rxjs/operators';

import {APIClient} from '../api-client.service';
import {Session} from '../session.service';
import {throwError} from 'rxjs';

import {HttpCacheService} from '../http-cache.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private apiClient: APIClient,
    private session: Session,
    private cache: HttpCacheService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      if (this.session.userId()) {
        this.apiClient.logoutUser().subscribe(() => {
          this.cache.clear();
          this.session.clear();
          this.router.navigate(['/login']);
        });
      }
    } else if (error.status === 404) {
      this.router.navigate(['/not-found']);
    }
    return throwError(error.error);
  }
}
