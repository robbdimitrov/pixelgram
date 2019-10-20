import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class ImageUploadService {
  file = new ReplaySubject<File>();

  setSelectedFile(file: File) {
    this.file.next(file);
  }

  deselectFile() {
    this.file.next(undefined);
  }
}
