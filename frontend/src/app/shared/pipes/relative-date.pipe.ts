import { Pipe, PipeTransform } from '@angular/core';
import { relativeDate } from '../helpers/relative-date';

@Pipe({
    name: 'relativedate'
})
export class RelativeDatePipe implements PipeTransform {

    transform(value: Date): string {
        return relativeDate(value);
    }

}
