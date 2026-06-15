import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {SessionService} from '../services/session.service';

export const authGuard: CanActivateFn = async (_route, _state) => {
  const router = inject(Router);
  const session = inject(SessionService);
  await session.bootstrap?.();
  if (!session.userId()) {
    return router.parseUrl('/login');
  }
  return true;
};
