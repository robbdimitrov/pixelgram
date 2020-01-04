import { Component } from '@angular/core';
import { APIClient } from '../../services/api-client.service';
import { Router } from '@angular/router';
import { ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  emailValue = '';
  passwordValue = '';

  passwordFieldType = 'password';
  showButtonTitle = 'Show';

  constructor(private apiClient: APIClient, private router: Router,
              private errorService: ErrorService) {}

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
    this.apiClient.loginUser(this.emailValue, this.passwordValue).subscribe(
      () => this.router.navigate(['/']),
      (error) => this.errorService.error = error.message
    );
  }
}
