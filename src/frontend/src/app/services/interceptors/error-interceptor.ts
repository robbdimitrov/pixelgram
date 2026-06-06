import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { APIClient } from '../api-client.service';
import { SessionService } from '../session.service';
import { HttpCacheService } from '../http-cache.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiClient = inject(APIClient);
  const session = inject(SessionService);
  const cache = inject(HttpCacheService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (session.userId() && !session.isClearing) {
          session.isClearing = true;
          cache.clear();
          session.clear();
          router.navigate(['/login']);
          apiClient.logoutUser().subscribe({
            complete: () => { session.isClearing = false; },
            error: () => { session.isClearing = false; }
          });
        }
      } else if (error.status === 404) {
        router.navigate(['/not-found']);
      }
      return throwError(() => error.error);
    })
  );
};
