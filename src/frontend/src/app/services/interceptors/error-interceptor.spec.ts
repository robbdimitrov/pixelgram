import { TestBed } from '@angular/core/testing';
import { HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError, of } from 'rxjs';

import { ErrorInterceptor } from './error-interceptor';
import { APIClient } from '../api-client.service';
import { SessionService } from '../session.service';
import { HttpCacheService } from '../http-cache.service';

describe('ErrorInterceptor', () => {
  let interceptor: ErrorInterceptor;
  let mockApiClient: any;
  let mockSession: any;
  let mockCache: any;
  let mockRouter: any;
  let mockHandler: any;

  beforeEach(() => {
    mockApiClient = {
      logoutUser: jest.fn()
    };
    mockSession = {
      userId: jest.fn(),
      clear: jest.fn()
    };
    mockCache = {
      clear: jest.fn()
    };
    mockRouter = {
      navigate: jest.fn()
    };
    mockHandler = {
      handle: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ErrorInterceptor,
        { provide: APIClient, useValue: mockApiClient },
        { provide: SessionService, useValue: mockSession },
        { provide: HttpCacheService, useValue: mockCache },
        { provide: Router, useValue: mockRouter }
      ]
    });

    interceptor = TestBed.inject(ErrorInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should pass through successful requests', (done) => {
    const request = new HttpRequest('GET', '/test');
    mockHandler.handle.mockReturnValue(of('response'));

    interceptor.intercept(request, mockHandler).subscribe({
      next: (res) => {
        expect(res).toBe('response');
        done();
      }
    });
  });

  it('should handle 401 error and clear local session if user is authenticated', (done) => {
    const request = new HttpRequest('GET', '/test');
    const errorResponse = new HttpErrorResponse({ status: 401, error: 'Unauthorized' });
    
    mockHandler.handle.mockReturnValue(throwError(() => errorResponse));
    mockSession.userId.mockReturnValue('123');
    mockApiClient.logoutUser.mockReturnValue(of(null));

    interceptor.intercept(request, mockHandler).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockApiClient.logoutUser).toHaveBeenCalled();
        expect(mockCache.clear).toHaveBeenCalled();
        expect(mockSession.clear).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });
  });

  it('should clear local session on 401 even if server logout fails', (done) => {
    const request = new HttpRequest('GET', '/test');
    const errorResponse = new HttpErrorResponse({ status: 401, error: 'Unauthorized' });

    mockHandler.handle.mockReturnValue(throwError(() => errorResponse));
    mockSession.userId.mockReturnValue('123');
    mockApiClient.logoutUser.mockReturnValue(throwError(() => new Error('Server Error')));

    interceptor.intercept(request, mockHandler).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockApiClient.logoutUser).toHaveBeenCalled();
        expect(mockCache.clear).toHaveBeenCalled();
        expect(mockSession.clear).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }
    });
  });

  it('should handle 401 error but not logout if user is not authenticated', (done) => {
    const request = new HttpRequest('GET', '/test');
    const errorResponse = new HttpErrorResponse({ status: 401, error: 'Unauthorized' });
    
    mockHandler.handle.mockReturnValue(throwError(() => errorResponse));
    mockSession.userId.mockReturnValue(null);

    interceptor.intercept(request, mockHandler).subscribe({
      error: (err) => {
        expect(err).toBe('Unauthorized');
        expect(mockApiClient.logoutUser).not.toHaveBeenCalled();
        expect(mockCache.clear).not.toHaveBeenCalled();
        expect(mockSession.clear).not.toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/login']);
        done();
      }
    });
  });

  it('should handle 404 error and navigate to /not-found', (done) => {
    const request = new HttpRequest('GET', '/test');
    const errorResponse = new HttpErrorResponse({ status: 404, error: 'Not Found' });
    
    mockHandler.handle.mockReturnValue(throwError(() => errorResponse));

    interceptor.intercept(request, mockHandler).subscribe({
      error: (err) => {
        expect(err).toBe('Not Found');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/not-found']);
        done();
      }
    });
  });

  it('should pass through other errors', (done) => {
    const request = new HttpRequest('GET', '/test');
    const errorResponse = new HttpErrorResponse({ status: 500, error: 'Server Error' });
    
    mockHandler.handle.mockReturnValue(throwError(() => errorResponse));

    interceptor.intercept(request, mockHandler).subscribe({
      error: (err) => {
        expect(err).toBe('Server Error');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        expect(mockSession.clear).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
