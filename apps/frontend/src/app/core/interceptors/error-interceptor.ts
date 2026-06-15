import {inject, PLATFORM_ID} from '@angular/core';
import {HttpInterceptorFn, HttpErrorResponse} from '@angular/common/http';
import {isPlatformBrowser} from '@angular/common';
import {Router} from '@angular/router';
import {catchError, throwError} from 'rxjs';

import {AuthService} from '../../features/auth/services/auth.service';
import {SessionService} from '../../features/auth/session.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return next(req).pipe(catchError((error: HttpErrorResponse) => throwError(() => error.error)));
  }

  const authService = inject(AuthService);
  const session = inject(SessionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (session.userId() && session.startClearing()) {
          session.clear();
          authService.logoutUser().subscribe({
            complete: () => session.stopClearing(),
            error: () => session.stopClearing()
          });
          router.navigate(['/login']);
        }
      } else if (error.status === 404) {
        router.navigate(['/not-found']);
      }
      return throwError(() => error.error);
    })
  );
};
