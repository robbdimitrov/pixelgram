import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';

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
  errorMessage = '';
  isSubmitting = false;

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
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.apiClient.loginUser(this.emailValue, this.passwordValue).subscribe({
      next: (data) => {
        this.isSubmitting = false;
        this.session.setUserId(data.id);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Could not log in. Please check your details.';
      }
    });
  }
}
