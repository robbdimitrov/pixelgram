import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ImageUploadService } from '../image-upload.service';
import { APIClient } from '../../../services/api-client.service';

@Component({
  selector: 'pg-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.scss']
})
export class PostCreateComponent implements OnDestroy {
  imageDescription: string;
  imagePreview: string;
  fileChangeSubscription: Subscription;
  selectedFile: File;

  constructor(private router: Router,
              private apiClient: APIClient,
              private uploadService: ImageUploadService) {
    this.subscribeToFileChange();
  }

  ngOnDestroy() {
    this.fileChangeSubscription.unsubscribe();
    this.uploadService.deselectFile();
  }

  // Subscriptions

  private subscribeToFileChange() {
    this.fileChangeSubscription = this.uploadService.file.subscribe((value) => {
      if (value) {
        this.selectedFile = value;
        this.getImagePreview(value);
      }
    });
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
    const self = this;
    this.apiClient.uploadImage(this.selectedFile).then((result) => {
      const imageDescription = self.imageDescription || '';
      self.apiClient.createImage((result as any).filename, imageDescription).then(() => {
        this.uploadService.setSelectedFile(undefined);
        this.router.navigate(['/']);
      });
    }).catch((error) => {
      console.log(`Error creating image: ${error}`);
    });
  }
}
