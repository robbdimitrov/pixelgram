import {Injectable} from '@angular/core';

@Injectable()
export class ImageUploadService {
  private file: File;

  setSelectedFile(file: File) {
    this.file = file;
  }

  selectedFile(): File {
    return this.file;
  }
}
