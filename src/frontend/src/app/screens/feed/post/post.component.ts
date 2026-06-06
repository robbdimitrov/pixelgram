import {Component, Input, OnDestroy, Output} from '@angular/core';
import {EventEmitter} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';
import {LucideHeart, LucideMessageCircle, LucideTrash2} from '@lucide/angular';

import {Post} from '../../../models/post.model';
import {User} from '../../../models/user.model';
import {SessionService} from '../../../services/session.service';
import {ImagePipe} from '../../../shared/pipes/image.pipe';
import {PluralizePipe} from '../../../shared/pipes/pluralize.pipe';
import {RelativeDatePipe} from '../../../shared/pipes/relative-date.pipe';
import {CommentsComponent} from '../comments/comments.component';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  standalone: true,
  imports: [RouterLink, NgClass, ImagePipe, PluralizePipe, RelativeDatePipe, CommentsComponent, LucideHeart, LucideMessageCircle, LucideTrash2]
})
export class PostComponent implements OnDestroy {
  private readonly fallbackImage = '/assets/placeholder.svg';
  private likeAnimationTimeout?: ReturnType<typeof setTimeout>;

  @Output() like = new EventEmitter<number>();
  @Output() unlike = new EventEmitter<number>();
  @Output() deleteAction = new EventEmitter<Post>();
  @Input() post: Post;
  @Input() user: User | null;
  @Input() singleView = false;
  isLikeAnimating = false;

  constructor(private session: SessionService) {}

  onLikeClick() {
    const wasLiked = this.post.liked;
    this.post.liked = !this.post.liked;
    this.post.likes += (this.post.liked ? 1 : -1);
    if (this.post.liked) {
      if (!wasLiked) {
        this.playLikeAnimation();
      }
      this.like.emit(this.post.id);
    } else {
      this.unlike.emit(this.post.id);
    }
  }

  ngOnDestroy() {
    if (this.likeAnimationTimeout) {
      clearTimeout(this.likeAnimationTimeout);
    }
  }

  isOwnedByCurrentUser() {
    return this.session.userId() === this.post.userId;
  }

  isDescriptionPresent() {
    return this.post.description.length > 0;
  }

  onImageError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    if (imageElement.src.endsWith(this.fallbackImage)) {
      return;
    }

    imageElement.src = this.fallbackImage;
  }

  onDeleteClick() {
    this.deleteAction.emit(this.post);
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
