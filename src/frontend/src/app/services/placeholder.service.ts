import { Injectable } from '@angular/core';

@Injectable()
export class PlaceholderService {
  private images: any;

  constructor() {
    this.images = {};
  }

  drawAvatar(name: string, size: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');

    context.fillStyle = '#F8F9F8';

    context.fillRect(0, 0, size, size);
    context.stroke();

    context.fillStyle = '#32323C';
    context.font = `${size * 0.4}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    let text = '';
    const names = name.split(' ').filter((item) => item.length !== 0);

    if (names.length > 0) {
      text = names[0][0];
      if (names.length > 1) {
        text += names[names.length - 1][0];
      }
    } else {
      text = '?';
    }

    context.fillText(text.toUpperCase(), size / 2, size / 2);

    const imageData = canvas.toDataURL('image/png');
    return imageData;
  }

  getAvatar(name: string): string {
    if (this.images[name] !== undefined) {
      return this.images[name];
    }

    const imageData = this.drawAvatar(name, 200);
    this.images[name] = imageData;

    return imageData;
  }
}