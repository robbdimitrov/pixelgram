import {TestBed} from '@angular/core/testing';
import {of, throwError} from 'rxjs';

import {SessionService} from './session.service';
import {ThemeService} from '../../core/theme.service';
import {UserService} from '../users/services/user.service';

describe('SessionService', () => {
  const user = {id: 7, username: 'test'};
  let session: SessionService;
  let userService: {getCurrentUser: import('vitest').Mock};
  let theme: {setPreference: import('vitest').Mock};

  beforeEach(() => {
    userService = {getCurrentUser: vi.fn().mockReturnValue(of(user))};
    theme = {setPreference: vi.fn()};
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        {provide: UserService, useValue: userService},
        {provide: ThemeService, useValue: theme}
      ]
    });
    session = TestBed.inject(SessionService);
  });

  it('bootstraps the authoritative current user once', async () => {
    await session.bootstrap();
    await session.bootstrap();

    expect(userService.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(session.currentUser()).toBe(user);
    expect(session.userId()).toBe(7);
    expect(session.bootstrapped()).toBe(true);
  });

  it('completes bootstrap without a user when the request fails', async () => {
    userService.getCurrentUser.mockReturnValue(throwError(() => new Error('Unauthorized')));

    await session.bootstrap();

    expect(session.currentUser()).toBeNull();
    expect(session.bootstrapped()).toBe(true);
  });

  it('clears only current-user state and resets the theme', () => {
    session.setCurrentUser(user as never);
    session.clear();

    expect(theme.setPreference).toHaveBeenCalledWith('system');
    expect(session.currentUser()).toBeNull();
  });
});
