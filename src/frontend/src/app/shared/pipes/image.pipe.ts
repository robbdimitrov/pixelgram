import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'image',
    standalone: false
})
export class ImagePipe implements PipeTransform {
  transform(value: string | null | undefined) {
    if (!value || value.length === 0) {
      return '/assets/placeholder.svg';
    }
    return `/api/uploads/${value}`;
  }
}
