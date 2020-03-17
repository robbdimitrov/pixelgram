import { Injectable } from '@angular/core';

import { placeholder } from '../shared/utils/placeholder';

@Injectable()
export class PlaceholderService {
  private images: any;

  constructor() {
    this.images = {};
  }

  getAvatar(name: string): string {
    if (this.images[name]) {
      return this.images[name];
    }

    const imageData = placeholder(name, 200);
    this.images[name] = imageData;

    return imageData;
  }
}
