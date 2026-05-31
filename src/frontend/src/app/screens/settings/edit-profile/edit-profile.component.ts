import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {APIClient} from '../../../services/api-client.service';
import {User} from '../../../models/user.model';
import {Session} from '../../../services/session.service';

@Component({
    selector: 'app-edit-profile',
    templateUrl: './edit-profile.component.html',
    standalone: false
})
export class EditProfileComponent implements OnInit {
  selectedFile: File | null = null;
  imagePreview = '';
  user?: User;
  errorMessage = '';

  constructor(
    private apiClient: APIClient,
    private router: Router,
    private session: Session
  ) {}

  ngOnInit() {
    const userId = this.session.userId();
    if (userId) {
      this.loadUser(userId);
    }
  }

  onSubmit() {
    const userId = this.session.userId();
    if (!userId) {
      return;
    }

    const updateClosure = () => {
      if (!this.user) {
        return;
      }

      this.errorMessage = '';
      this.apiClient.updateUser(userId, this.user.name, this.user.username,
        this.user.email, this.user.avatar, this.user.bio).subscribe({
          next: () => this.router.navigate(['/settings']),
          error: (error) => this.errorMessage = error.message || 'Could not update profile. Please try again.'
        });
    };

    if (this.selectedFile) {
      this.apiClient.uploadImage(this.selectedFile).subscribe({
        next: (data) => this.user!.avatar = data.filename,
        error: (error) => this.errorMessage = error.message || 'Could not upload avatar. Please try again.',
        complete: () => updateClosure()
      });
    } else {
      updateClosure();
    }
  }

  onChange(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    this.selectedFile = files[0];
    this.loadImagePreview(this.selectedFile);
  }

  loadImagePreview(file: File) {
    if (!file) {
      this.imagePreview = '';
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
  }

  loadUser(userId: number) {
    this.apiClient.getUser(userId).subscribe({
      next: (value) => this.user = value,
      error: (error) => console.error(`Loading user failed: ${error.message}`)
    });
  }
}
