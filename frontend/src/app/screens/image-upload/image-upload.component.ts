import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ImageUploadService } from './image-upload.service';

@Component({
  selector: 'pg-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent implements OnDestroy {
  imagePreview: string;
  fileChangeSubscription: Subscription;

  constructor(private router: Router,
              public uploadService: ImageUploadService) {
    this.subscribeToFileChange();
  }

  ngOnDestroy() {
    this.fileChangeSubscription.unsubscribe();
  }

  private subscribeToFileChange() {
    this.fileChangeSubscription = this.uploadService.file.subscribe((value) => {
      this.getImagePreview(value);
    });
  }

  onChange(files: File[]) {
    const file = files[0];
    if (!file) {
      return;
    }
    this.uploadService.setSelectedFile(files[0]);
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
