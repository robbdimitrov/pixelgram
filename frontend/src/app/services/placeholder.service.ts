import { Injectable } from '@angular/core';

@Injectable()
export class PlaceholderService {

    private images: Object;

    constructor() {
        this.images = {};
    }

    drawAvatar(name: string): string {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');

        context.fillStyle = '#F8F9F8';

        let size = 100;

        context.fillRect(0, 0, size, size);
        context.stroke();

        context.fillStyle = '#32323C';
        context.font = `${size}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        let string = name.split(' ').reduce((previousValue, currentValue) => {
            return previousValue + currentValue[0];
        }, '');
        context.fillText(string, size / 2, size / 2);

        let imageData = canvas.toDataURL('image/png');
        return imageData;
    }

    getAvatar(name: string): string {
        if (this.images[name] !== undefined) {
            return this.images[name];
        }

        let imageData = this.drawAvatar(name);
        this.images[name] = imageData;

        return imageData;
    }

}
