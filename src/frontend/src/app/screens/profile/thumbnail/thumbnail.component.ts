import {Component, Input} from '@angular/core';

import {Post} from '../../../models/post.model';

@Component({
    selector: 'app-thumbnail',
    templateUrl: './thumbnail.component.html',
    standalone: false
})
export class ThumbnailComponent {
  @Input() post: Post;
}
