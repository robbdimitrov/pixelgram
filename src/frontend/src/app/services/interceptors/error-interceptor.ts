import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';

import { APIClient } from '../api-client.service';
import { Session } from '../session.service';
import { throwError } from 'rxjs';

import { CacheService } from '../cache.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private apiClient: APIClient,
              private session: Session,
              private cache: CacheService,
              private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      this.apiClient.logoutUser().subscribe(() => {
        this.cache.clear();
        this.session.clear();
        this.router.navigate(['/login']);
      });
    } else if (error.status === 404) {
      this.router.navigate(['/404']);
    }
    return throwError(error.error);
  }
}
