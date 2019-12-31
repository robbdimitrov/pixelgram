import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Session } from '../../services/session.service';
import { APIClient } from '../../services/api-client.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private session: Session, private apiClient: APIClient) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<boolean> | Promise<boolean> | boolean {
    const token = this.session.token();
    if (token === null) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
