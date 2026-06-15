import {ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';
import {LucideHeart, LucideMessageCircle, LucideTrash2} from '@lucide/angular';

import {Post} from '../../../../posts/models/post.model';
import {SessionService} from '../../../../auth/session.service';
import {ImagePipe} from '../../../../../shared/ui/pipes/image.pipe';
import {PluralizePipe} from '../../../../../shared/ui/pipes/pluralize.pipe';
import {RelativeDatePipe} from '../../../../../shared/ui/pipes/relative-date.pipe';
import {CommentsComponent} from '../comments/comments.component';
import {AvatarStyleDirective} from '../../../../../shared/ui/directives/avatar-style.directive';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgClass, ImagePipe, PluralizePipe, RelativeDatePipe, CommentsComponent, LucideHeart, LucideMessageCircle, LucideTrash2, AvatarStyleDirective]
})
export class PostComponent {
  private readonly fallbackImage = '/assets/placeholder.svg';
  private likeAnimationTimeout?: ReturnType<typeof setTimeout>;
  private session = inject(SessionService);
  private destroyRef = inject(DestroyRef);

  like = output<string>();
  unlike = output<string>();
  deleteAction = output<Post>();
  post = input.required<Post>();
  singleView = input(false);
  isLikeAnimating = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.likeAnimationTimeout) {
        clearTimeout(this.likeAnimationTimeout);
      }
    });
  }

  onLikeClick() {
    const post = this.post();
    const wasLiked = post.liked;
    post.liked = !post.liked;
    post.likes += (post.liked ? 1 : -1);
    if (post.liked) {
      if (!wasLiked) {
        this.playLikeAnimation();
      }
      this.like.emit(post.publicId);
    } else {
      this.unlike.emit(post.publicId);
    }
  }

  isOwnedByCurrentUser() {
    return this.session.userId() === this.post().userId;
  }

  isDescriptionPresent() {
    return this.post().description && this.post().description!.length > 0;
  }

  onImageError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    if (imageElement.src.endsWith(this.fallbackImage)) {
      return;
    }
    imageElement.src = this.fallbackImage;
  }

  onDeleteClick() {
    this.deleteAction.emit(this.post());
  }

  private playLikeAnimation() {
    if (this.likeAnimationTimeout) {
      clearTimeout(this.likeAnimationTimeout);
    }
    this.isLikeAnimating.set(false);
    requestAnimationFrame(() => {
      this.isLikeAnimating.set(true);
      this.likeAnimationTimeout = setTimeout(() => {
        this.isLikeAnimating.set(false);
      }, 220);
    });
  }
}
