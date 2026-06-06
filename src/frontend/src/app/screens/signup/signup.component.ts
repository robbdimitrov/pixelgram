import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {switchMap} from 'rxjs';

import {APIClient} from '../../services/api-client.service';
import {SessionService} from '../../services/session.service';
import {FormInputStyleDirective, PrimaryActionStyleDirective} from '../../shared/directives/form-control-style.directive';
import {TrimDirective} from '../../shared/directives/trim.directive';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  standalone: true,
  imports: [FormsModule, RouterLink, FormInputStyleDirective, PrimaryActionStyleDirective, TrimDirective]
})
export class SignupComponent implements OnInit {
  private apiClient = inject(APIClient);
  private router = inject(Router);
  private session = inject(SessionService);

  nameValue = '';
  usernameValue = '';
  emailValue = '';
  passwordValue = '';
  errorMessage = '';

  passwordFieldType = 'password';
  showButtonTitle = 'Show';

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
    this.apiClient.createUser(this.nameValue, this.usernameValue, this.emailValue, this.passwordValue).pipe(
      switchMap(() => this.apiClient.loginUser(this.emailValue, this.passwordValue))
    ).subscribe({
      next: (data) => {
        this.session.setUserId(data.id);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Could not create account. Please try again.';
      }
    });
  }
}
