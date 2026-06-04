import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {SessionService} from '../services/session.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const session = inject(SessionService);
  if (!session.userId()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
