import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ImageUploadService } from '../image-upload.service';
import { APIClient } from '../../../services/api-client.service';

@Component({
  selector: 'pg-image-create',
  templateUrl: './image-create.component.html',
  styleUrls: ['./image-create.component.scss']
})
export class ImageCreateComponent {
  imageDescription: string;
  imagePreview: string;

  constructor(private router: Router,
              private apiClient: APIClient,
              private uploadService: ImageUploadService) {
    this.getImagePreview(this.uploadService.selectedFile());
  }

  hasSelectedFile(): boolean {
    return this.imagePreview !== undefined && this.imagePreview.length !== 0;
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

  onSubmitClick() {
    const selectedFile = this.uploadService.selectedFile();

    this.apiClient.uploadImage(selectedFile).then((result) => {
      const imageDescription = this.imageDescription || '';
      this.apiClient.createImage((result as any).filename, imageDescription).then(() => {
        this.router.navigate(['/']);
      });
    }).catch((error) => {
      console.log(`Error creating image: ${error}`);
    });
  }
}
