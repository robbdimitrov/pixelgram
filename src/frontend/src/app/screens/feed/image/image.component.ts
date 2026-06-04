import {Component, Input, OnDestroy, Output} from '@angular/core';
import {EventEmitter} from '@angular/core';

import {Image} from '../../../models/image.model';
import {User} from '../../../models/user.model';
import {SessionService} from '../../../services/session.service';

@Component({
    selector: 'app-image',
    templateUrl: './image.component.html',
    standalone: false
})
export class ImageComponent implements OnDestroy {
  private readonly fallbackImage = '/assets/placeholder.svg';
  private likeAnimationTimeout?: ReturnType<typeof setTimeout>;

  @Output() like = new EventEmitter<number>();
  @Output() unlike = new EventEmitter<number>();
  @Output() deleteAction = new EventEmitter<Image>();
  @Input() image: Image;
  @Input() user: User | null;
  @Input() singleView = false;
  isLikeAnimating = false;

  constructor(private session: SessionService) {}

  onLikeClick() {
    const wasLiked = this.image.liked;
    this.image.liked = !this.image.liked;
    this.image.likes += (this.image.liked ? 1 : -1);
    if (this.image.liked) {
      if (!wasLiked) {
        this.playLikeAnimation();
      }
      this.like.emit(this.image.id);
    } else {
      this.unlike.emit(this.image.id);
    }
  }

  ngOnDestroy() {
    if (this.likeAnimationTimeout) {
      clearTimeout(this.likeAnimationTimeout);
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

  private playLikeAnimation() {
    if (this.likeAnimationTimeout) {
      clearTimeout(this.likeAnimationTimeout);
    }

    this.isLikeAnimating = false;
    requestAnimationFrame(() => {
      this.isLikeAnimating = true;
      this.likeAnimationTimeout = setTimeout(() => {
        this.isLikeAnimating = false;
      }, 220);
    });
  }
}
