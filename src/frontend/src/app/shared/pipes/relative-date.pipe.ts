import {Pipe, PipeTransform} from '@angular/core';

import {dateString}  from 'quartzite';

@Pipe({
    name: 'relativedate',
    standalone: false
})
export class RelativeDatePipe implements PipeTransform {
  transform(value: Date): string {
    return dateString(value);
  }
}
