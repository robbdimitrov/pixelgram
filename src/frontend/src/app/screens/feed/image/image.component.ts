import {Component, Input, Output} from '@angular/core';
import {EventEmitter} from '@angular/core';

import {Image} from '../../../models/image.model';
import {User} from '../../../models/user.model';
import {Session} from '../../../services/session.service';

@Component({
    selector: 'app-image',
    templateUrl: './image.component.html',
    standalone: false
})
export class ImageComponent {
  private readonly fallbackImage = '/assets/placeholder.svg';

  @Output() like = new EventEmitter<number>();
  @Output() unlike = new EventEmitter<number>();
  @Output() deleteAction = new EventEmitter<Image>();
  @Input() image: Image;
  @Input() user: User | null;
  constructor(private session: Session) {}

  onLikeClick() {
    this.image.liked = !this.image.liked;
    this.image.likes += (this.image.liked ? 1 : -1);
    if (this.image.liked) {
      this.like.emit(this.image.id);
    } else {
      this.unlike.emit(this.image.id);
    }
  }

  isOwnedByCurrentUser() {
    return this.session.userId() === this.image.userId;
  }

  isDescriptionPresent() {
    return this.image.description.length > 0;
  }

  onImageError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    if (imageElement.src.endsWith(this.fallbackImage)) {
      return;
    }

    imageElement.src = this.fallbackImage;
  }

  onDeleteClick() {
    this.deleteAction.emit(this.image);
  }
}
