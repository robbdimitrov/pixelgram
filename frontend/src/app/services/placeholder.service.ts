import { Injectable } from '@angular/core';

@Injectable()
export class PlaceholderService {

    private images: Object;

    constructor() {
        this.images = {};
    }

    drawAvatar(name: string, size: number): string {
        let canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        let context = canvas.getContext('2d');

        context.fillStyle = '#F8F9F8';

        context.fillRect(0, 0, size, size);
        context.stroke();

        context.fillStyle = '#32323C';
        context.font = `${size * 0.4}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        if (name.length > 0) {
            let string = name.split(' ').reduce((previousValue, currentValue) => {
                return previousValue + currentValue[0].toUpperCase();
            }, '');
            context.fillText(string, size / 2, size / 2);
        }

        let imageData = canvas.toDataURL('image/png');
        return imageData;
    }

    getAvatar(name: string): string {
        if (this.images[name] !== undefined) {
            return this.images[name];
        }

        let imageData = this.drawAvatar(name, 200);
        this.images[name] = imageData;

        return imageData;
    }

}
