import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { APIClient } from '../api-client.service';
import { SessionService } from '../session.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const apiClient = inject(APIClient);
  const session = inject(SessionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (session.userId() && session.startClearing()) {
          session.clear();
          router.navigate(['/login']);
          apiClient.logoutUser().subscribe({
            complete: () => session.stopClearing(),
            error: () => session.stopClearing()
          });
        }
      } else if (error.status === 404) {
        router.navigate(['/not-found']);
      }
      return throwError(() => error.error);
    })
  );
};
