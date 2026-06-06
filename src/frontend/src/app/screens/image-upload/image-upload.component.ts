import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {concatMap, finalize} from 'rxjs/operators';
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
  readonly maxDescriptionLength = 160;
  readonly maxFileSizeBytes = maxUploadSizeBytes;
  readonly supportedMimeTypes = supportedUploadMimeTypes;

  imageDescription = '';
  imagePreview = '';
  errorMessage = '';
  isSubmitting = false;
  isDragging = false;
  private selectedFile?: File;

  constructor(
    private router: Router,
    private apiClient: APIClient
  ) {}

  onChange(files: FileList | null) {
    this.selectFile(files?.item(0));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.selectFile(event.dataTransfer?.files.item(0));
  }

  private async selectFile(file?: File | null) {
    this.errorMessage = '';
    if (!file) {
      return;
    }

    try {
      this.selectedFile = await resizeImageForUpload(file);
      this.getImagePreview(this.selectedFile);
    } catch (error) {
      this.clearSelection();
      this.errorMessage = error instanceof Error ? error.message : 'Could not prepare image.';
    }
  }

  getImagePreview(file?: File) {
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

  canShare(): boolean {
    return Boolean(this.selectedFile && !this.isSubmitting);
  }

  clearSelection() {
    this.selectedFile = undefined;
    this.imagePreview = '';
  }

  onSubmitClick() {
    if (!this.selectedFile || this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;
    const imageDescription = this.imageDescription.trim();

    this.apiClient.uploadImage(this.selectedFile).pipe(
      concatMap((data) => this.apiClient.createPost(data.filename, imageDescription)),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => this.router.navigate(['/']),
      error: (error) => this.errorMessage = error.error?.message ||
        error.message || 'Could not share this post. Please try again.'
    });
  }
}
