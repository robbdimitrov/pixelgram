import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ImageUploadService } from './image-upload.service';

@Component({
  selector: 'app-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {
  imagePreview: string;

  constructor(private router: Router,
              private uploadService: ImageUploadService) {}

  onChange(files: File[]) {
    const file = files[0];
    if (!file) {
      return;
    }
    this.uploadService.setSelectedFile(file);
    this.getImagePreview(file);
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

  onNextClick() {
    this.router.navigate(['/upload/post']);
  }
}
