import { Component, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { APIClient } from '../../../services/api-client.service';
import { ErrorService } from '../../../services/error.service';
import { User } from '../../../models/user.model';
import { Session } from '../../../services/session.service';

@Component({
    selector: 'pg-edit-profile',
    templateUrl: './edit-profile.component.html',
    styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements AfterViewInit {

    nameValue = '';
    usernameValue = '';
    emailValue = '';
    bioValue = '';
    selectedFile: any;
    imagePreview: string;
    user: User;

    constructor(private apiClient: APIClient, private router: Router,
        private errorService: ErrorService, private location: Location,
        private session: Session) {}

    ngAfterViewInit(): void {
        let userId = this.session.userId();
        this.loadUser(userId);
    }

    onSubmit() {
        let userId = this.session.userId();

        let self = this;

        let updateClosure = (avatar?: string) => {
            self.apiClient.updateUser(userId, self.nameValue, self.usernameValue,
                self.emailValue, self.bioValue, avatar).then((result) => {
                self.location.back();
            }).catch((error) => {
                self.errorService.error = error.error;
            });
        };

        if (this.selectedFile) {
            self.apiClient.uploadImage(self.selectedFile).then((result) => {
                updateClosure(result['filename']);
            }).catch((error) => {
                self.errorService.error = error.error;
            });
        } else {
            updateClosure();
        }
    }

    onChange(files) {
        this.selectedFile = files[0];
        this.getImagePreview(this.selectedFile);
    }

    getImagePreview(file: File) {
        const reader: FileReader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            this.imagePreview = reader.result;
        };
    }

    loadUser(userId: string) {
        let self = this;
        this.apiClient.getUser(userId).then((result) => {
            self.user = result;
            self.nameValue = result.name;
            self.usernameValue = result.username;
            self.emailValue = result.email;
            self.bioValue = result.bio;
        }).catch((error) => {
            console.log('Loading user failed: ' + error);
        });
    }

}
