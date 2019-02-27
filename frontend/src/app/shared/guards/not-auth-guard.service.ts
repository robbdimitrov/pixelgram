import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Session } from '../../services/session.service';
import { APIClient } from '../../services/api-client.service';

@Injectable()
export class NotAuthGuard implements CanActivate {

    constructor(private router: Router, private session: Session, private apiClient: APIClient) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<boolean>|Promise<boolean>|boolean {
        let token = this.session.token();
        if (token !== null) {
            this.router.navigate(['/']);
            return false;
        }
        return true;
    }

}
