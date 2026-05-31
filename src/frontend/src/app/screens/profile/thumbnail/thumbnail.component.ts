import {Component, Input} from '@angular/core';

import {Image} from '../../../models/image.model';

@Component({
    selector: 'app-thumbnail',
    templateUrl: './thumbnail.component.html',
    standalone: false
})
export class ThumbnailComponent {
  @Input() image: Image;
}
