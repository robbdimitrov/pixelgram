import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { APIClient } from '../../../services/api-client.service';
import { Session } from '../../../services/session.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {
  oldPasswordValue = '';
  oldPasswordFieldType = 'password';
  oldPasswordShowButtonTitle = 'Show';

  passwordValue = '';
  passwordFieldType = 'password';
  passwordShowButtonTitle = 'Show';

  constructor(private apiClient: APIClient,
              private session: Session,
              private router: Router) {}

  onSubmit() {
    const userId = this.session.userId();
    this.apiClient.changePassword(userId, this.oldPasswordValue,
      this.passwordValue).subscribe(
        () => this.router.navigate(['/settings']),
        (error) => window.alert(error.message)
      );
  }

  onVisibilityToggle(element) {
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
