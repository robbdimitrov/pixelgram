import { Pipe, PipeTransform } from '@angular/core';
import * as quartzite from 'quartzite';

@Pipe({
  name: 'relativedate'
})
export class RelativeDatePipe implements PipeTransform {
  transform(value: Date): string {
    return quartzite.formatDate(value);
  }
}
