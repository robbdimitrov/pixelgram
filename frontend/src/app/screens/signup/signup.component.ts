import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { APIClient } from '../../services/api-client.service';
import { FormComponent } from '../../shared/components/form/form.component';
import { ErrorService } from '../../services/error.service';

@Component({
    selector: 'pg-signup',
    templateUrl: './signup.component.html'
})
export class SignupComponent extends FormComponent {

    nameValue = '';
    usernameValue = '';
    emailValue = '';
    passwordValue = '';

    constructor(apiClient: APIClient, private router: Router,
        private errorService: ErrorService) {
        super(apiClient);
    }

    onSubmit() {
        this.apiClient.createUser(this.nameValue, this.usernameValue,
            this.emailValue, this.passwordValue).then((result) => {
            this.apiClient.loginUser(this.emailValue, this.passwordValue).then((result) => {
                this.router.navigate(['/']);
            });
        }).catch((error) => {
            this.errorService.error = error.error;
        });
    }

}
