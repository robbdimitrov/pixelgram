import {TestBed} from '@angular/core/testing';
import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {PLATFORM_ID, REQUEST} from '@angular/core';

import {SessionService} from '../services/session.service';
import {authGuard} from './auth-guard.service';

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

function makeRequest(cookieHeader: string): Request {
  return {headers: {get: (name: string) => name.toLowerCase() === 'cookie' ? cookieHeader : null}} as unknown as Request;
}

function run(): boolean | ReturnType<typeof authGuard> {
  return TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));
}

describe('authGuard — browser platform', () => {
  let mockRouter: {navigate: jest.Mock};
  let mockSession: {userId: jest.Mock};

  beforeEach(() => {
    mockRouter = {navigate: jest.fn()};
    mockSession = {userId: jest.fn()};

    TestBed.configureTestingModule({
      providers: [
        {provide: Router, useValue: mockRouter},
        {provide: SessionService, useValue: mockSession},
        {provide: PLATFORM_ID, useValue: 'browser'}
      ]
    });
  });

  it('should allow access if userId is set', () => {
    mockSession.userId.mockReturnValue(123);
    expect(run()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login and return false if userId is null', () => {
    mockSession.userId.mockReturnValue(null);
    expect(run()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('authGuard — server platform', () => {
  let mockRouter: {navigate: jest.Mock};

  beforeEach(() => {
    mockRouter = {navigate: jest.fn()};
  });

  afterEach(() => TestBed.resetTestingModule());

  function setup(cookieHeader: string) {
    TestBed.configureTestingModule({
      providers: [
        {provide: Router, useValue: mockRouter},
        {provide: SessionService, useValue: {userId: jest.fn()}},
        {provide: PLATFORM_ID, useValue: 'server'},
        {provide: REQUEST, useValue: makeRequest(cookieHeader)}
      ]
    });
  }

  it('should allow access when session cookie is present', () => {
    setup('session=abc123');
    expect(run()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login and return false when session cookie is absent', () => {
    setup('');
    expect(run()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login when only unrelated cookies are present', () => {
    setup('theme=dark; othercookie=value');
    expect(run()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
