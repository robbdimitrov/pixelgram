import { Component, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';

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

  constructor(private apiClient: APIClient,
              private errorService: ErrorService,
              private location: Location,
              private session: Session,
              private placeholderService: PlaceholderService) {}

  ngAfterViewInit(): void {
    const userId = this.session.userId();
    this.loadUser(userId);
  }

  onSubmit() {
    const userId = this.session.userId();

    const updateClosure = (avatar?: string) => {
      this.apiClient.updateUser(userId, this.nameValue, this.usernameValue,
        this.emailValue, this.bioValue, avatar).then((result) => {
          this.location.back();
        }).catch((error) => {
          this.errorService.error = error.message;
        });
    };

    if (this.selectedFile) {
      this.apiClient.uploadImage(this.selectedFile).then((result) => {
        updateClosure((result as any).filename);
      }).catch((error) => {
        this.errorService.error = error.message;
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
    if (!file) {
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
    this.apiClient.getUser(userId).then((result) => {
      this.user = result;
      this.nameValue = result.name;
      this.usernameValue = result.username;
      this.emailValue = result.email;
      this.bioValue = result.bio;
    }).catch((error) => {
      console.log(`Loading user failed: ${error}`);
    });
  }

  avatarPlaceholder() {
    const name = this.user ? this.user.name : '';
    return this.placeholderService.getAvatar(name);
  }
}
