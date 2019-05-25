import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { APIClient } from '../../../services/api-client.service';
import { ErrorService } from '../../../services/error.service';
import { Session } from '../../../services/session.service';

@Component({
    selector: 'pg-change-password',
    templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent {

    oldPasswordValue = '';
    oldPasswordFieldType = 'password';
    oldPasswordShowButtonTitle = 'Show';

    passwordValue = '';
    passwordFieldType = 'password';
    passwordShowButtonTitle = 'Show';

    constructor(private apiClient: APIClient, private router: Router,
        private errorService: ErrorService, private session: Session,
        private location: Location) {}

    onSubmit() {
        let userId = this.session.userId();
        this.apiClient.changePassword(userId, this.oldPasswordValue,
            this.passwordValue).then((result) => {
            this.location.back();
        }).catch((error) => {
            this.errorService.error = error.message;
        });
    }

    onVisibilityToggle(event, element) {
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
