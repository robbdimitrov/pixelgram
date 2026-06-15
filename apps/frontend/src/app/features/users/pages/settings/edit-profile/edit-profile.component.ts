import {Component, inject, signal, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {LucideArrowLeft, LucideTrash2, LucideCamera} from '@lucide/angular';
import {finalize, Observable, of, switchMap, tap} from 'rxjs';

import {UserService} from '../../../services/user.service';
import {PostService} from '../../../../posts/services/post.service';
import {User} from '../../../models/user.model';
import {SessionService} from '../../../../auth/session.service';
import {ImagePipe} from '../../../../../shared/ui/pipes/image.pipe';
import {
  FormInputStyleDirective,
  FormTextareaStyleDirective,
  PrimaryActionStyleDirective
} from '../../../../../shared/ui/directives/form-control-style.directive';
import {TrimDirective} from '../../../../../shared/ui/directives/trim.directive';
import {
  maxUploadSizeBytes,
  resizeImageForUpload,
  supportedUploadMimeTypes
} from '../../../../../shared/utils/image-resizer';
import {AvatarStyleDirective} from '../../../../../shared/ui/directives/avatar-style.directive';

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
    LucideTrash2,
    LucideCamera,
    AvatarStyleDirective
  ]
})
export class EditProfileComponent implements OnInit {
  private userService = inject(UserService);
  private postService = inject(PostService);
  private router = inject(Router);
  private session = inject(SessionService);

  readonly maxFileSizeBytes = maxUploadSizeBytes;
  readonly supportedMimeTypes = supportedUploadMimeTypes;

  selectedFile = signal<File | null>(null);
  imagePreview = signal('');
  user = signal<User | undefined>(undefined);
  errorMessage = signal('');
  isSubmitting = signal(false);

  ngOnInit() {
    const user = this.session.currentUser();
    if (user) {
      this.user.set({...user});
    }
  }

  onSubmit() {
    const userId = this.session.userId();
    const user = this.user();
    if (!userId || !user || this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const currentSelectedFile = this.selectedFile();
    let isUploading = Boolean(currentSelectedFile);
    const upload: Observable<{filename: string} | null> = currentSelectedFile
      ? this.postService.uploadImage(currentSelectedFile).pipe(tap((data) => this.user.update(u => u ? {...u, avatar: data.filename} : u)))
      : of(null);

    upload.pipe(
      switchMap(() => {
        const u = this.user()!;
        isUploading = false;
        return this.userService.updateUser(userId, u.name, u.username,
          u.email, u.avatar ?? '', u.bio ?? '');
      }),
      switchMap(() => this.userService.getCurrentUser()),
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (updatedUser) => {
        this.session.setCurrentUser(updatedUser);
        this.router.navigate(['/settings']);
      },
      error: (error) => {
        this.errorMessage.set(isUploading
          ? error.error?.message || error.message || 'Could not upload avatar. Please try again.'
          : error.message || 'Could not update profile. Please try again.');
      }
    });
  }

  async onChange(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    this.errorMessage.set('');

    try {
      const resized = await resizeImageForUpload(file);
      this.selectedFile.set(resized);
      this.loadImagePreview(resized);
    } catch (error) {
      this.clearSelectedFile();
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not prepare avatar.');
    }
  }

  clearSelectedFile() {
    this.selectedFile.set(null);
    this.imagePreview.set('');
  }

  removeAvatar() {
    if (!this.user()) {
      return;
    }

    this.clearSelectedFile();
    this.user.update(u => u ? {...u, avatar: ''} : u);
  }

  loadImagePreview(file: File) {
    if (!file) {
      this.imagePreview.set('');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
  }

}
