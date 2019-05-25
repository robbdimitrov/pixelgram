import { Component, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { APIClient } from '../../../services/api-client.service';
import { ErrorService } from '../../../services/error.service';
import { User } from '../../../models/user.model';
import { Session } from '../../../services/session.service';
import { PlaceholderService } from '../../../services/placeholder.service';

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
        private session: Session, private placeholderService: PlaceholderService) {}

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
                self.errorService.error = error.message;
            });
        };

        if (this.selectedFile) {
            self.apiClient.uploadImage(self.selectedFile).then((result) => {
                updateClosure(result['filename']);
            }).catch((error) => {
                self.errorService.error = error.message;
            });
        } else {
            updateClosure();
        }
    }

    onChange(files: any[]) {
        this.selectedFile = files[0];
        this.getImagePreview(this.selectedFile);
    }

    getImagePreview(file: File) {
        if (file === undefined) {
            this.imagePreview = '';
            return;
        }
        const reader: FileReader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            this.imagePreview = reader.result as string;
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

    avatarPlaceholder() {
        let name = this.user ? this.user.name : '';
        return this.placeholderService.getAvatar(name);
    }
}
