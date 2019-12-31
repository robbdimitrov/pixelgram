import { Pipe, PipeTransform } from '@angular/core';

import { environment } from '../../../environments/environment';

@Pipe({
  name: 'image'
})
export class ImagePipe implements PipeTransform {
  transform(value: string, placeholder: string = '') {
    if (value === null || value.length === 0) {
      return placeholder || '';
    }
    return `${environment.apiRoot}/uploads/${value}`;
  }
}
