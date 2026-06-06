import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpErrorResponse, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError, of, Observable } from 'rxjs';

import { errorInterceptor } from './error-interceptor';
import { APIClient } from '../api-client.service';
import { SessionService } from '../session.service';

function runInterceptor(next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  return TestBed.runInInjectionContext(() =>
    errorInterceptor(new HttpRequest('GET', '/test'), next)
  );
}

describe('errorInterceptor', () => {
  let mockApiClient: any;
  let mockSession: any;
  let mockRouter: any;

  beforeEach(() => {
    mockApiClient = { logoutUser: jest.fn() };
    mockSession = { userId: jest.fn(), clear: jest.fn(), startClearing: jest.fn(), stopClearing: jest.fn() };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: APIClient, useValue: mockApiClient },
        { provide: SessionService, useValue: mockSession },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should pass through successful requests', (done) => {
    const next: HttpHandlerFn = () => of({ type: 4 } as unknown as HttpEvent<unknown>);
    runInterceptor(next).subscribe({
      next: (res) => {
        expect(res).toBeTruthy();
        done();
      }
    });
  });

  it('should handle 401 error and clear local session if user is authenticated', (done) => {
    const errorResponse = new HttpErrorResponse({ status: 401, error: 'Unauthorized' });
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue('123');
    mockSession.startClearing.mockReturnValue(true);
    mockApiClient.logoutUser.mockReturnValue(of(null));

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockApiClient.logoutUser).toHaveBeenCalled();
        expect(mockSession.clear).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });
  });

  it('should clear local session on 401 even if server logout fails', (done) => {
    const errorResponse = new HttpErrorResponse({ status: 401, error: 'Unauthorized' });
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue('123');
    mockSession.startClearing.mockReturnValue(true);
    mockApiClient.logoutUser.mockReturnValue(throwError(() => new Error('Server Error')));

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockApiClient.logoutUser).toHaveBeenCalled();
        expect(mockSession.clear).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });
  });

  it('should handle 401 error but not logout if user is not authenticated', (done) => {
    const errorResponse = new HttpErrorResponse({ status: 401, error: 'Unauthorized' });
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue(null);

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockApiClient.logoutUser).not.toHaveBeenCalled();
        expect(mockSession.clear).not.toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/login']);
        done();
      }
    });
  });

  it('should handle 404 error and navigate to /not-found', (done) => {
    const errorResponse = new HttpErrorResponse({ status: 404, error: 'Not Found' });
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue(null);

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Not Found');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/not-found']);
        done();
      }
    });
  });

  it('should pass through other errors', (done) => {
    const errorResponse = new HttpErrorResponse({ status: 500, error: 'Server Error' });
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    mockSession.userId.mockReturnValue(null);

    runInterceptor(next).subscribe({
      error: (err) => {
        expect(err).toBe('Server Error');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        expect(mockSession.clear).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
