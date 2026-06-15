import {TestBed} from '@angular/core/testing';
import {HttpRequest, HttpErrorResponse, HttpHandlerFn, HttpEvent} from '@angular/common/http';
import {Router} from '@angular/router';
import {PLATFORM_ID} from '@angular/core';
import {throwError, of, Observable} from 'rxjs';

import {errorInterceptor} from './error-interceptor';
import {AuthService} from '../../features/auth/services/auth.service';
import {SessionService} from '../../features/auth/session.service';

function runInterceptor(next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  return TestBed.runInInjectionContext(() =>
    errorInterceptor(new HttpRequest('GET', '/test'), next)
  );
}

describe('errorInterceptor — browser platform', () => {
  let mockAuthService: {logoutUser: import('vitest').Mock};
  let mockSession: {userId: import('vitest').Mock; clear: import('vitest').Mock; startClearing: import('vitest').Mock; stopClearing: import('vitest').Mock};
  let mockRouter: {navigate: import('vitest').Mock};

  beforeEach(() => {
    mockAuthService = {logoutUser: vi.fn()};
    mockSession = {userId: vi.fn(), clear: vi.fn(), startClearing: vi.fn(), stopClearing: vi.fn()};
    mockRouter = {navigate: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        {provide: PLATFORM_ID, useValue: 'browser'},
        {provide: AuthService, useValue: mockAuthService},
        {provide: SessionService, useValue: mockSession},
        {provide: Router, useValue: mockRouter}
      ]
    });
  });

  it('should pass through successful requests', async () => {
    await new Promise<void>((resolve, reject) => {
    const next: HttpHandlerFn = () => of({type: 4} as unknown as HttpEvent<unknown>);
    runInterceptor(next).subscribe({
      next: (res) => {
        expect(res).toBeTruthy();
        resolve();
      }
    });
    });
  });

  it('should handle 401 error and clear local session if user is authenticated', async () => {
    await new Promise<void>((resolve, reject) => {
    const errorResponse = new HttpErrorResponse({status: 401, error: 'Unauthorized'});
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue('123');
    mockSession.startClearing.mockReturnValue(true);
    mockAuthService.logoutUser.mockReturnValue(of(null));

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockAuthService.logoutUser).toHaveBeenCalled();
        expect(mockSession.clear).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        resolve();
      }
    });
    });
  });

  it('should clear local session on 401 even if server logout fails', async () => {
    await new Promise<void>((resolve, reject) => {
    const errorResponse = new HttpErrorResponse({status: 401, error: 'Unauthorized'});
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue('123');
    mockSession.startClearing.mockReturnValue(true);
    mockAuthService.logoutUser.mockReturnValue(throwError(() => new Error('Server Error')));

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockAuthService.logoutUser).toHaveBeenCalled();
        expect(mockSession.clear).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        resolve();
      }
    });
    });
  });

  it('should handle 401 error but not logout if user is not authenticated', async () => {
    await new Promise<void>((resolve, reject) => {
    const errorResponse = new HttpErrorResponse({status: 401, error: 'Unauthorized'});
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue(null);

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockAuthService.logoutUser).not.toHaveBeenCalled();
        expect(mockSession.clear).not.toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/login']);
        resolve();
      }
    });
    });
  });

  it('should handle 404 error and navigate to /not-found', async () => {
    await new Promise<void>((resolve, reject) => {
    const errorResponse = new HttpErrorResponse({status: 404, error: 'Not Found'});
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue(null);

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Not Found');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/not-found']);
        resolve();
      }
    });
    });
  });

  it('should pass through other errors', async () => {
    await new Promise<void>((resolve, reject) => {
    const errorResponse = new HttpErrorResponse({status: 500, error: 'Server Error'});
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue(null);

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Server Error');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        expect(mockSession.clear).not.toHaveBeenCalled();
        resolve();
      }
    });
    });
  });
});

describe('errorInterceptor — server platform', () => {
  let mockRouter: {navigate: import('vitest').Mock};
  let mockSession: {userId: import('vitest').Mock; clear: import('vitest').Mock};

  beforeEach(() => {
    mockRouter = {navigate: vi.fn()};
    mockSession = {userId: vi.fn(), clear: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        {provide: PLATFORM_ID, useValue: 'server'},
        {provide: AuthService, useValue: {logoutUser: vi.fn()}},
        {provide: SessionService, useValue: mockSession},
        {provide: Router, useValue: mockRouter}
      ]
    });
  });

  it('should propagate a 401 on the server without calling router or session', async () => {
    await new Promise<void>((resolve, reject) => {
    const errorResponse = new HttpErrorResponse({status: 401, error: 'Unauthorized'});
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        expect(mockSession.clear).not.toHaveBeenCalled();
        resolve();
      }
    });
    });
  });

  it('should propagate a 404 on the server without calling router', async () => {
    await new Promise<void>((resolve, reject) => {
    const errorResponse = new HttpErrorResponse({status: 404, error: 'Not Found'});
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Not Found');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        resolve();
      }
    });
    });
  });
});
