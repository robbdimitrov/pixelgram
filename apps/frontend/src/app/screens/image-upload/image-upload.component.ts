import {Component, inject, signal} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {concatMap} from 'rxjs/operators';
import {LucideSquarePlus} from '@lucide/angular';

import {APIClient} from '../../services/api-client.service';
import {
  maxUploadSizeBytes,
  resizeImageForUpload,
  supportedUploadMimeTypes
} from '../../shared/utils/image-resizer';

@Component({
  selector: 'app-upload',
  templateUrl: './image-upload.component.html',
  standalone: true,
  imports: [FormsModule, NgClass, LucideSquarePlus]
})
export class ImageUploadComponent {
  private router = inject(Router);
  private apiClient = inject(APIClient);

  readonly maxDescriptionLength = 160;
  readonly maxFileSizeBytes = maxUploadSizeBytes;
  readonly supportedMimeTypes = supportedUploadMimeTypes;

  imageDescription = '';
  imagePreview = signal('');
  errorMessage = signal('');
  isSubmitting = signal(false);
  isDragging = signal(false);
  selectedFile = signal<File | undefined>(undefined);

  onChange(files: FileList | null) {
    this.selectFile(files?.item(0));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    this.selectFile(event.dataTransfer?.files.item(0));
  }

  private async selectFile(file?: File | null) {
    this.errorMessage.set('');
    if (!file) {
      return;
    }

    try {
      const resized = await resizeImageForUpload(file);
      this.selectedFile.set(resized);
      this.getImagePreview(resized);
    } catch (error) {
      this.clearSelection();
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not prepare image.');
    }
  }

  getImagePreview(file?: File) {
    if (!file) {
      this.imagePreview.set('');
      return;
    }
    const reader: FileReader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
  }

  canShare(): boolean {
    return Boolean(this.selectedFile() && !this.isSubmitting());
  }

  clearSelection() {
    this.selectedFile.set(undefined);
    this.imagePreview.set('');
  }

  onSubmitClick() {
    if (!this.selectedFile() || this.isSubmitting()) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);
    const imageDescription = this.imageDescription.trim();

    this.apiClient.uploadImage(this.selectedFile()!).pipe(
      concatMap((data) => this.apiClient.createPost(data.filename, imageDescription))
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message || error.message || 'Could not share this post. Please try again.');
      }
    });
  }
}
