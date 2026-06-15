import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';

import {SessionService} from '../services/session.service';
import {authGuard} from './auth-guard.service';

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

describe('authGuard', () => {
  it('waits for bootstrap and allows an authenticated user', async () => {
    const session = {bootstrap: jest.fn().mockResolvedValue(undefined), userId: jest.fn().mockReturnValue(7)};
    TestBed.configureTestingModule({
      providers: [
        {provide: Router, useValue: {parseUrl: jest.fn()}},
        {provide: SessionService, useValue: session}
      ]
    });

    const result = await TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));

    expect(session.bootstrap).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('returns a login UrlTree after unauthenticated bootstrap', async () => {
    const loginTree = {url: '/login'};
    const router = {parseUrl: jest.fn().mockReturnValue(loginTree)};
    const session = {bootstrap: jest.fn().mockResolvedValue(undefined), userId: jest.fn().mockReturnValue(null)};
    TestBed.configureTestingModule({
      providers: [
        {provide: Router, useValue: router},
        {provide: SessionService, useValue: session}
      ]
    });

    const result = await TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));

    expect(result).toBe(loginTree);
    expect(router.parseUrl).toHaveBeenCalledWith('/login');
  });
});
