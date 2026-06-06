import {Component, OnInit} from '@angular/core';
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
export class LoginComponent implements OnInit {
  emailValue = '';
  passwordValue = '';
  errorMessage = '';

  passwordFieldType = 'password';
  showButtonTitle = 'Show';

  constructor(private apiClient: APIClient,
              private router: Router,
              private session: SessionService) {}

  ngOnInit() {
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
    this.errorMessage = '';
    this.apiClient.loginUser(this.emailValue, this.passwordValue).subscribe({
      next: (data) => {
        this.session.setUserId(data.id);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Could not log in. Please check your details.';
      }
    });
  }
}
