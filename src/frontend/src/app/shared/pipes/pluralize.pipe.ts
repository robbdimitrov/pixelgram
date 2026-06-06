import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pluralize',
  standalone: true
})
export class PluralizePipe implements PipeTransform {
  transform(value: number, singular: string, plural?: string): string {
    const count = value || 0;
    if (count === 1) {
      return singular;
    }
    return plural || singular + 's';
  }
}
