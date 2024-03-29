import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'image'
})
export class ImagePipe implements PipeTransform {
  transform(value: string) {
    if (!value || value.length === 0) {
      return '/assets/placeholder.svg';
    }
    return `/api/uploads/${value}`;
  }
}
