import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';

import { APIClient } from '../api-client.service';
import { Session } from '../session.service';
import { throwError } from 'rxjs';


@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private apiClient: APIClient, private session: Session,
              private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error(`An error occurred: ${error.error.message}`);
    } else {
      console.error(`An error occurred: ${error.message}: ` +
        error.error.message);

      if (error.status === 401) { // Unauthorized
        if (!this.session.userId()) {
          return;
        }
        this.apiClient.logoutUser().subscribe(
          () => {
            this.session.reset();
            this.router.navigate(['/']);
          }
        );
      }
    }
    return throwError(error.error);
  }
}
