import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {of, Subject} from 'rxjs';

import {LoginComponent} from './login.component';
import {AuthService} from '../../services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {SessionService} from '../../session.service';
import {UserIdDto} from '../../../users/models/user.model';

describe('LoginComponent', () => {
  it('updates the session before navigating after login', () => {
    const user = {id: 42, username: 'test'};
    const authService = {
      loginUser: vi.fn().mockReturnValue(new Subject<UserIdDto>())
    };
    const userService = {
      getCurrentUser: vi.fn().mockReturnValue(of(user))
    };
    const session = {userId: () => null, setCurrentUser: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: AuthService, useValue: authService},
        {provide: UserService, useValue: userService},
        {provide: SessionService, useValue: session}
      ]
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(LoginComponent).componentInstance;

    component.onSubmit();
    authService.loginUser.mock.results[0].value.next({id: 42});

    expect(session.setCurrentUser).toHaveBeenCalledWith(user);
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(session.setCurrentUser.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
  });

  it('should block duplicate submissions and reset after an error', () => {
    const response = new Subject<UserIdDto>();
    const authService = {loginUser: vi.fn().mockReturnValue(response)};
    const userService = {getCurrentUser: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: AuthService, useValue: authService},
        {provide: UserService, useValue: userService},
        {provide: SessionService, useValue: {userId: () => null, setCurrentUser: vi.fn()}}
      ]
    });
    const component = TestBed.createComponent(LoginComponent).componentInstance;

    component.onSubmit();
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
    expect(authService.loginUser).toHaveBeenCalledTimes(1);

    response.error(new Error('Login failed'));

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Login failed');
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
