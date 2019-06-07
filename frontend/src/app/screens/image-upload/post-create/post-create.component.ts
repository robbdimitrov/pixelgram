import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { ImageUploadService } from '../image-upload.service';
import { APIClient } from '../../../services/api-client.service';
import { ErrorService } from '../../../services/error.service';

@Component({
  selector: 'pg-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.scss']
})
export class PostCreateComponent implements OnDestroy {
  imageDescription: string;
  imagePreview: string;
  fileChangeSubscription: Subscription;

  constructor(private router: Router, private apiClient: APIClient,
    private uploadService: ImageUploadService, private errorService: ErrorService) {
    this.subscribeToFileChange();
    this.getImagePreview(uploadService.selectedFile());
  }

  ngOnDestroy() {
    this.fileChangeSubscription.unsubscribe();
  }

  // Subscriptions

  private subscribeToFileChange() {
    this.fileChangeSubscription = this.uploadService.fileChangeSubject.subscribe((value) => {
      this.getImagePreview(this.uploadService.selectedFile());
    });
  }

  hasSelectedFile(): boolean {
    return this.uploadService.selectedFile() !== undefined;
  }

  getImagePreview(file: File) {
    if (!file) {
      return;
    }
    const reader: FileReader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
  }

  onSubmitClick() {
    let self = this;
    this.apiClient.uploadImage(this.uploadService.selectedFile()).then((result) => {
      let imageDescription = self.imageDescription || '';
      self.apiClient.createImage(result['filename'], imageDescription).then((result) => {
        this.uploadService.setSelectedFile(undefined);
        this.router.navigate(['/']);
      });
    }).catch((error) => {
      console.log('Error creating image: ' + error);
    });
  }
}
