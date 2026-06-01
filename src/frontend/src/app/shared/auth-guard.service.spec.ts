import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Session } from '../services/session.service';
import { authGuard } from './auth-guard.service';

describe('authGuard', () => {
  let mockRouter: any;
  let mockSession: any;

  beforeEach(() => {
    mockRouter = {
      navigate: jest.fn()
    };
    mockSession = {
      userId: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Session, useValue: mockSession }
      ]
    });
  });

  it('should allow access if user is authenticated', () => {
    mockSession.userId.mockReturnValue('123');

    const result = TestBed.runInInjectionContext(() => {
      return authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });

    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login and block access if user is not authenticated', () => {
    mockSession.userId.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() => {
      return authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
