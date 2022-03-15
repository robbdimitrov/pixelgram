import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {APIClient} from '../../services/api-client.service';
import {Session} from '../../services/session.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  emailValue = '';
  passwordValue = '';

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
    this.apiClient.loginUser(this.emailValue, this.passwordValue).subscribe(
      (data: any) => {
        this.session.setUserId(data.id);
        this.router.navigate(['/']);
      },
      (error) => window.alert(error.message)
    );
  }
}
