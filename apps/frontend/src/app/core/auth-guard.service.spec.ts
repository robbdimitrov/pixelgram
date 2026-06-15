import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';

import {SessionService} from '../features/auth/session.service';
import {authGuard} from './auth-guard.service';

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

describe('authGuard', () => {
  it('waits for bootstrap and allows an authenticated user', async () => {
    const session = {bootstrap: vi.fn().mockResolvedValue(undefined), userId: vi.fn().mockReturnValue(7)};
    TestBed.configureTestingModule({
      providers: [
        {provide: Router, useValue: {parseUrl: vi.fn()}},
        {provide: SessionService, useValue: session}
      ]
    });

    const result = await TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));

    expect(session.bootstrap).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('returns a login UrlTree after unauthenticated bootstrap', async () => {
    const loginTree = {url: '/login'};
    const router = {parseUrl: vi.fn().mockReturnValue(loginTree)};
    const session = {bootstrap: vi.fn().mockResolvedValue(undefined), userId: vi.fn().mockReturnValue(null)};
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
