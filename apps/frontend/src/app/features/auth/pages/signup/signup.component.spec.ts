import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {Subject} from 'rxjs';

import {SignupComponent} from './signup.component';
import {AuthService} from '../../services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {SessionService} from '../../session.service';
import {UserIdDto} from '../../../users/models/user.model';

describe('SignupComponent', () => {
  it('should block duplicate submissions and reset after an error', () => {
    const response = new Subject<UserIdDto>();
    const authService = {
      createUser: vi.fn().mockReturnValue(response),
      loginUser: vi.fn()
    };
    const userService = {
      getCurrentUser: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: AuthService, useValue: authService},
        {provide: UserService, useValue: userService},
        {provide: SessionService, useValue: {userId: () => null, setCurrentUser: vi.fn()}}
      ]
    });
    const fixture = TestBed.createComponent(SignupComponent);
    const component = fixture.componentInstance;

    component.onSubmit();
    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
    expect(authService.createUser).toHaveBeenCalledTimes(1);

    response.error({message: 'User with this username or email already exists.'});
    fixture.detectChanges();

    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('User with this username or email already exists.');
    expect(authService.loginUser).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(fixture.nativeElement.textContent).toContain('User with this username or email already exists.');
    expect(fixture.nativeElement.textContent).toContain('Create Account');
    expect(fixture.nativeElement.textContent).not.toContain('Creating Account...');
  });
});
