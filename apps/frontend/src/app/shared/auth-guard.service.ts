import {inject, PLATFORM_ID, REQUEST} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {isPlatformServer} from '@angular/common';

import {SessionService} from '../services/session.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);

  if (isPlatformServer(inject(PLATFORM_ID))) {
    const request = inject(REQUEST, {optional: true});
    const cookieHeader = request?.headers.get('cookie') ?? '';
    const hasSession = /(?:^|;\s*)session=([^;]+)/.test(cookieHeader);
    if (!hasSession) {
      return router.parseUrl('/login');
    }
    return true;
  }

  const session = inject(SessionService);
  if (!session.userId()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
