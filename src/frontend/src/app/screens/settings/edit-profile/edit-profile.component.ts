import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {LucideArrowLeft, LucideTrash2} from '@lucide/angular';
import {finalize, Observable, of, switchMap, tap} from 'rxjs';

import {APIClient} from '../../../services/api-client.service';
import {User} from '../../../models/user.model';
import {SessionService} from '../../../services/session.service';
import {ImagePipe} from '../../../shared/pipes/image.pipe';
import {
  FormInputStyleDirective,
  FormTextareaStyleDirective,
  PrimaryActionStyleDirective
} from '../../../shared/directives/form-control-style.directive';
import {TrimDirective} from '../../../shared/directives/trim.directive';
import {
  maxUploadSizeBytes,
  resizeImageForUpload,
  supportedUploadMimeTypes
} from '../../../shared/utils/image-resizer';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ImagePipe,
    FormInputStyleDirective,
    FormTextareaStyleDirective,
    PrimaryActionStyleDirective,
    TrimDirective,
    LucideArrowLeft,
    LucideTrash2
  ]
})
export class EditProfileComponent {
  private apiClient = inject(APIClient);
  private router = inject(Router);
  private session = inject(SessionService);

  readonly maxFileSizeBytes = maxUploadSizeBytes;
  readonly supportedMimeTypes = supportedUploadMimeTypes;

  selectedFile: File | null = null;
  imagePreview = '';
  user?: User;
  errorMessage = '';
  isSubmitting = false;

  constructor() {
    const userId = this.session.userId();
    if (userId) {
      this.loadUser(userId);
    }
  }

  onSubmit() {
    const userId = this.session.userId();
    if (!userId || !this.user || this.isSubmitting) {
      return;
    }
    const user = this.user;
    this.isSubmitting = true;
    this.errorMessage = '';

    let isUploading = Boolean(this.selectedFile);
    const upload: Observable<{filename: string} | null> = this.selectedFile
      ? this.apiClient.uploadImage(this.selectedFile).pipe(tap((data) => user.avatar = data.filename))
      : of(null);

    upload.pipe(
      switchMap(() => {
        isUploading = false;
        return this.apiClient.updateUser(userId, user.name, user.username,
          user.email, user.avatar ?? '', user.bio ?? '');
      }),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => this.router.navigate(['/settings']),
      error: (error) => {
        this.errorMessage = isUploading
          ? error.error?.message || error.message || 'Could not upload avatar. Please try again.'
          : error.message || 'Could not update profile. Please try again.';
      }
    });
  }

  async onChange(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    this.errorMessage = '';

    try {
      this.selectedFile = await resizeImageForUpload(file);
      this.loadImagePreview(this.selectedFile);
    } catch (error) {
      this.clearSelectedFile();
      this.errorMessage = error instanceof Error ? error.message : 'Could not prepare avatar.';
    }
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.imagePreview = '';
  }

  removeAvatar() {
    if (!this.user) {
      return;
    }

    this.clearSelectedFile();
    this.user.avatar = '';
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
      error: () => this.errorMessage = 'Could not load profile. Please try again.'
    });
  }
}
