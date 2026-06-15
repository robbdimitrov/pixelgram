import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {Subject} from 'rxjs';

import {SignupComponent} from './signup.component';
import {APIClient} from '../../services/api-client.service';
import {SessionService} from '../../services/session.service';
import {UserIdDto} from '../../models/user.model';

describe('SignupComponent', () => {
  it('should block duplicate submissions and reset after an error', () => {
    const response = new Subject<UserIdDto>();
    const apiClient = {
      createUser: jest.fn().mockReturnValue(response),
      loginUser: jest.fn(),
      getCurrentUser: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: APIClient, useValue: apiClient},
        {provide: SessionService, useValue: {userId: () => null, setCurrentUser: jest.fn()}}
      ]
    });
    const fixture = TestBed.createComponent(SignupComponent);
    const component = fixture.componentInstance;

    component.onSubmit();
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
    expect(apiClient.createUser).toHaveBeenCalledTimes(1);

    response.error({message: 'User with this username or email already exists.'});
    fixture.detectChanges();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('User with this username or email already exists.');
    expect(apiClient.loginUser).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(fixture.nativeElement.textContent).toContain('User with this username or email already exists.');
    expect(fixture.nativeElement.textContent).toContain('Create Account');
    expect(fixture.nativeElement.textContent).not.toContain('Creating Account...');
  });
});
