import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {LucideHeart} from '@lucide/angular';

import {Post} from '../../../models/post.model';
import {ImagePipe} from '../../../shared/pipes/image.pipe';

@Component({
  selector: 'app-thumbnail',
  templateUrl: './thumbnail.component.html',
  standalone: true,
  imports: [RouterLink, ImagePipe, LucideHeart]
})
export class ThumbnailComponent {
  post = input.required<Post>();
}
