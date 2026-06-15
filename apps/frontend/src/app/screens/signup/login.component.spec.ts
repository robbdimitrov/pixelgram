import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {of, Subject} from 'rxjs';

import {LoginComponent} from './login.component';
import {APIClient} from '../../services/api-client.service';
import {SessionService} from '../../services/session.service';
import {UserIdDto} from '../../models/user.model';

describe('LoginComponent', () => {
  it('updates the session before navigating after login', () => {
    const user = {id: 42, username: 'test'};
    const apiClient = {
      loginUser: jest.fn().mockReturnValue(new Subject<UserIdDto>()),
      getCurrentUser: jest.fn().mockReturnValue(of(user))
    };
    const session = {userId: () => null, setCurrentUser: jest.fn()};

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: session}
      ]
    });
    const router = TestBed.inject(Router);
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(LoginComponent).componentInstance;

    component.onSubmit();
    apiClient.loginUser.mock.results[0].value.next({id: 42});

    expect(session.setCurrentUser).toHaveBeenCalledWith(user);
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(session.setCurrentUser.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
  });

  it('should block duplicate submissions and reset after an error', () => {
    const response = new Subject<UserIdDto>();
    const apiClient = {loginUser: jest.fn().mockReturnValue(response), getCurrentUser: jest.fn()};

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => null, setCurrentUser: jest.fn()}}
      ]
    });
    const component = TestBed.createComponent(LoginComponent).componentInstance;

    component.onSubmit();
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
    expect(apiClient.loginUser).toHaveBeenCalledTimes(1);

    response.error(new Error('Login failed'));

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Login failed');
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
