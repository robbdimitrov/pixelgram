import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class ImageUploadService {
  private file: File;
  fileChangeSubject = new Subject();

  setSelectedFile(file: File) {
    this.file = file;
    this.fileChangeSubject.next();
  }

  selectedFile() {
    return this.file;
  }
}
