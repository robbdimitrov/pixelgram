import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { Session } from '../services/session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private session: Session) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!this.session.userId()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
