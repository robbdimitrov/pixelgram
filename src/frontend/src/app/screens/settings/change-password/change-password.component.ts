import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {LucideArrowLeft} from '@lucide/angular';

import {APIClient} from '../../../services/api-client.service';
import {SessionService} from '../../../services/session.service';
import {
  FormInputStyleDirective,
  PrimaryActionStyleDirective
} from '../../../shared/directives/form-control-style.directive';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  standalone: true,
  imports: [FormsModule, RouterLink, FormInputStyleDirective, PrimaryActionStyleDirective, LucideArrowLeft]
})
export class ChangePasswordComponent {
  private apiClient = inject(APIClient);
  private session = inject(SessionService);
  private router = inject(Router);

  oldPasswordValue = '';
  oldPasswordFieldType = 'password';
  oldPasswordShowButtonTitle = 'Show';

  passwordValue = '';
  passwordFieldType = 'password';
  passwordShowButtonTitle = 'Show';
  errorMessage = '';
  isSubmitting = false;

  onSubmit() {
    const userId = this.session.userId();
    if (!userId || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;

    this.errorMessage = '';
    this.apiClient.changePassword(userId, this.oldPasswordValue, this.passwordValue).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/settings']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Could not update password. Please try again.';
      }
    });
  }

  onVisibilityToggle(element: HTMLInputElement) {
    if (element.name === 'old-password') {
      this.toggleOldPasswordVisibility();
    } else if (element.name === 'password') {
      this.toggleNewPasswordVisibility();
    }
  }

  toggleOldPasswordVisibility() {
    if (this.oldPasswordFieldType === 'password') {
      this.oldPasswordFieldType = 'text';
      this.oldPasswordShowButtonTitle = 'Hide';
    } else {
      this.oldPasswordFieldType = 'password';
      this.oldPasswordShowButtonTitle = 'Show';
    }
  }

  toggleNewPasswordVisibility() {
    if (this.passwordFieldType === 'password') {
      this.passwordFieldType = 'text';
      this.passwordShowButtonTitle = 'Hide';
    } else {
      this.passwordFieldType = 'password';
      this.passwordShowButtonTitle = 'Show';
    }
  }
}
