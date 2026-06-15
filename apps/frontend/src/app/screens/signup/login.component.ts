import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {finalize, switchMap} from 'rxjs';

import {APIClient} from '../../services/api-client.service';
import {SessionService} from '../../services/session.service';
import {FormInputStyleDirective, PrimaryActionStyleDirective} from '../../shared/directives/form-control-style.directive';
import {TrimDirective} from '../../shared/directives/trim.directive';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [FormsModule, RouterLink, FormInputStyleDirective, PrimaryActionStyleDirective, TrimDirective]
})
export class LoginComponent {
  private apiClient = inject(APIClient);
  private router = inject(Router);
  private session = inject(SessionService);

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
    this.apiClient.loginUser(this.emailValue, this.passwordValue).pipe(
      switchMap(() => this.apiClient.getCurrentUser()),
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (user) => {
        this.session.setCurrentUser(user);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Could not log in. Please check your details.');
      }
    });
  }
}
