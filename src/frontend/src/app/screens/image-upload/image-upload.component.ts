import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {concatMap, finalize} from 'rxjs/operators';

import {APIClient} from '../../services/api-client.service';

@Component({
    selector: 'app-upload',
    templateUrl: './image-upload.component.html',
    standalone: false
})
export class ImageUploadComponent {
  readonly maxDescriptionLength = 160;
  readonly maxFileSizeBytes = 1024 * 1024;

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

  private selectFile(file?: File | null) {
    this.errorMessage = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.clearSelection();
      this.errorMessage = 'Choose a valid image file.';
      return;
    }
    if (file.size > this.maxFileSizeBytes) {
      this.clearSelection();
      this.errorMessage = 'Choose an image under 1MB.';
      return;
    }

    this.selectedFile = file;
    this.getImagePreview(file);
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
      concatMap((data) => this.apiClient.createImage(data.filename, imageDescription)),
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => this.router.navigate(['/']),
      error: (error) => this.errorMessage = error.message || 'Could not share this post. Please try again.'
    });
  }
}
