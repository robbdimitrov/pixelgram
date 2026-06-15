import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {switchMap} from 'rxjs';

import {AuthService} from '../../services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {SessionService} from '../../session.service';
import {FormInputStyleDirective, PrimaryActionStyleDirective} from '../../../../shared/ui/directives/form-control-style.directive';
import {TrimDirective} from '../../../../shared/ui/directives/trim.directive';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  standalone: true,
  imports: [FormsModule, RouterLink, FormInputStyleDirective, PrimaryActionStyleDirective, TrimDirective]
})
export class SignupComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private session = inject(SessionService);

  nameValue = '';
  usernameValue = '';
  emailValue = '';
  passwordValue = '';
  errorMessage = signal('');
  isSubmitting = signal(false);

  passwordFieldType = 'password';
  showButtonTitle = 'Show';

  constructor() {
    if (this.session.userId()) {
      this.router.navigate(['/']);
    }
  }

  onVisibilityToggle() {
    if (this.passwordFieldType === 'password') {
      this.passwordFieldType = 'text';
      this.showButtonTitle = 'Hide';
    } else {
      this.passwordFieldType = 'password';
      this.showButtonTitle = 'Show';
    }
  }

  onSubmit() {
    if (this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.authService.createUser(this.nameValue, this.usernameValue, this.emailValue, this.passwordValue).pipe(
      switchMap(() => this.authService.loginUser(this.emailValue, this.passwordValue)),
      switchMap(() => this.userService.getCurrentUser())
    ).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.session.setCurrentUser(user);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.message || 'Could not create account. Please try again.');
      }
    });
  }
}
