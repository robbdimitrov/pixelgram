import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { ThemeService } from './theme.service';

describe('SessionService', () => {
  let session: SessionService;
  let mockThemeService: any;

  beforeEach(() => {
    mockThemeService = {
      setPreference: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: ThemeService, useValue: mockThemeService }
      ]
    });

    session = TestBed.inject(SessionService);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(session).toBeTruthy();
  });

  describe('userId', () => {
    it('should return null if no userId in localStorage', () => {
      expect(session.userId()).toBeNull();
    });

    it('should return userId as a number from localStorage', () => {
      localStorage.setItem('userId', '123');
      expect(session.userId()).toBe(123);
    });
  });

  describe('setUserId', () => {
    it('should set userId in localStorage as string', () => {
      session.setUserId(456);
      expect(localStorage.getItem('userId')).toBe('456');
    });
  });

  describe('clear', () => {
    it('should reset theme preference to system and clear the session user id', () => {
      localStorage.setItem('userId', '999');
      localStorage.setItem('someOtherKey', 'value');

      session.clear();

      expect(mockThemeService.setPreference).toHaveBeenCalledWith('system');
      expect(localStorage.getItem('userId')).toBeNull();
      expect(localStorage.getItem('someOtherKey')).toBe('value');
    });
  });
});
