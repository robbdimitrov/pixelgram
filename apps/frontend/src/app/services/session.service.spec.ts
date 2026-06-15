import {TestBed} from '@angular/core/testing';
import {of, throwError} from 'rxjs';

import {SessionService} from './session.service';
import {ThemeService} from './theme.service';
import {APIClient} from './api-client.service';

describe('SessionService', () => {
  const user = {id: 7, username: 'test'};
  let session: SessionService;
  let apiClient: {getCurrentUser: jest.Mock};
  let theme: {setPreference: jest.Mock};

  beforeEach(() => {
    apiClient = {getCurrentUser: jest.fn().mockReturnValue(of(user))};
    theme = {setPreference: jest.fn()};
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        {provide: APIClient, useValue: apiClient},
        {provide: ThemeService, useValue: theme}
      ]
    });
    session = TestBed.inject(SessionService);
  });

  it('bootstraps the authoritative current user once', async () => {
    await session.bootstrap();
    await session.bootstrap();

    expect(apiClient.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(session.currentUser()).toBe(user);
    expect(session.userId()).toBe(7);
    expect(session.bootstrapped()).toBe(true);
  });

  it('completes bootstrap without a user when the request fails', async () => {
    apiClient.getCurrentUser.mockReturnValue(throwError(() => new Error('Unauthorized')));

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
