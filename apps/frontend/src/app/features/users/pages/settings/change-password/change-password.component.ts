import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {LucideArrowLeft} from '@lucide/angular';
import {finalize} from 'rxjs';

import {UserService} from '../../../services/user.service';
import {SessionService} from '../../../../auth/session.service';
import {CardStyleDirective} from '../../../../../shared/ui/directives/card-style.directive';
import {
  FormInputStyleDirective,
  PrimaryActionStyleDirective
} from '../../../../../shared/ui/directives/form-control-style.directive';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  standalone: true,
  imports: [FormsModule, RouterLink, FormInputStyleDirective, PrimaryActionStyleDirective, LucideArrowLeft, CardStyleDirective]
})
export class ChangePasswordComponent {
  private userService = inject(UserService);
  private session = inject(SessionService);
  private router = inject(Router);

  oldPasswordValue = '';
  oldPasswordFieldType = 'password';
  oldPasswordShowButtonTitle = 'Show';

  passwordValue = '';
  passwordFieldType = 'password';
  passwordShowButtonTitle = 'Show';
  errorMessage = signal('');
  isSubmitting = signal(false);

  onSubmit() {
    const userId = this.session.userId();
    if (!userId || this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);

    this.errorMessage.set('');
    this.userService.changePassword(userId, this.oldPasswordValue, this.passwordValue).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => this.router.navigate(['/settings']),
      error: (error) => {
        this.errorMessage.set(error.message || 'Could not update password. Please try again.');
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
