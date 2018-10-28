import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'moment'
})
export class MomentPipe implements PipeTransform {

    transform(value: Date): any {
        let now = new Date();
        if (moment(now).isBefore(moment(value).add(1, 'day'))) {
            return moment(value).fromNow();
        } else if (moment(now).isBefore(moment(value).add(7, 'days'))) {
            return moment(value).calendar();
        } else if (value.getFullYear === now.getFullYear) {
            return moment(value).format('MMMM DD');
        }
        return moment(value).format('MMMM DD, YYYY');
    }

}
