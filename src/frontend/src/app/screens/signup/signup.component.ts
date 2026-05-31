import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {APIClient} from '../../services/api-client.service';
import {Session} from '../../services/session.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    standalone: false
})
export class SignupComponent implements OnInit {
  nameValue = '';
  usernameValue = '';
  emailValue = '';
  passwordValue = '';
  errorMessage = '';

  passwordFieldType = 'password';
  showButtonTitle = 'Show';

  constructor(private apiClient: APIClient,
              private router: Router,
              private session: Session) {}

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
    this.apiClient.createUser(this.nameValue, this.usernameValue,
      this.emailValue, this.passwordValue).subscribe({
        next: () => {
          this.apiClient.loginUser(this.emailValue, this.passwordValue).subscribe(
            (data) => {
              this.session.setUserId(data.id);
              this.router.navigate(['/']);
            }
          );
        },
        error: (error) => {
          this.errorMessage = error.message || 'Could not create account. Please try again.';
        }
    });
  }
}
