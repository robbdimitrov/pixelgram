import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ImageUploadService } from './image-upload.service';

@Component({
    selector: 'pg-upload',
    templateUrl: './image-upload.component.html',
    styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {

    imagePreview: string;

    constructor(private router: Router,
        public uploadService: ImageUploadService) {}

    onChange(files) {
        this.uploadService.setSelectedFile(files[0]);
        this.getImagePreview(this.uploadService.selectedFile());
    }

    getImagePreview(file: File) {
        if (file === undefined) {
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
