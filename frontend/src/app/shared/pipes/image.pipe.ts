import { Pipe, PipeTransform } from '@angular/core';

import * as config from '../../../../config/client.config';

@Pipe({
    name: 'image'
})
export class ImagePipe implements PipeTransform {

    transform(value: string, placeholder: string) {
        if (value === null || value.length === 0) {
            return placeholder || '';
        }
        return `${config.apiRoot}/uploads/${value}`;
    }

}
