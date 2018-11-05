import { Component } from '@angular/core';
import { APIClient } from '../../services/api-client.service';
import { FormComponent } from '../../shared/components/form/form.component';
import { Router } from '@angular/router';
import { ErrorService } from '../../services/error.service';

@Component({
    selector: 'pg-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent extends FormComponent {

    emailValue = '';
    passwordValue = '';

    constructor(apiClient: APIClient, private router: Router,
        private errorService: ErrorService) {
        super(apiClient);
    }

    onSubmit() {
        this.apiClient.loginUser(this.emailValue, this.passwordValue).then((result) => {
            this.router.navigate(['/']);
        }).catch((error) => {
            this.errorService.error = error.error;
        });
    }

}
