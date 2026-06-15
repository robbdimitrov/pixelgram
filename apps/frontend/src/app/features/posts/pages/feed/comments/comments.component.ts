import {Component, inject, input, OnInit, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {LucideSend, LucideTrash2} from '@lucide/angular';

import {PostService} from '../../../services/post.service';
import {SessionService} from '../../../../auth/session.service';
import {PaginationService} from '../../../../../shared/services/pagination.service';
import {Comment} from '../../../models/comment.model';
import {ImagePipe} from '../../../../../shared/ui/pipes/image.pipe';
import {RelativeDatePipe} from '../../../../../shared/ui/pipes/relative-date.pipe';
import {AvatarStyleDirective} from '../../../../../shared/ui/directives/avatar-style.directive';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  providers: [PaginationService],
  standalone: true,
  imports: [RouterLink, FormsModule, ImagePipe, RelativeDatePipe, LucideSend, LucideTrash2, AvatarStyleDirective]
})
export class CommentsComponent implements OnInit {
  private postService = inject(PostService);
  private session = inject(SessionService);
  private pagination = inject<PaginationService<Comment>>(PaginationService);

  publicId = input.required<string>();

  newCommentBody = '';
  isSubmitting = signal(false);
  isLoadingMore = signal(false);

  ngOnInit() {
    this.loadPage();
  }

  comments() {
    return this.pagination.data();
  }

  hasMore() {
    return this.pagination.hasMore();
  }

  isOwnComment(comment: Comment) {
    return this.session.userId() === comment.userId;
  }

  onLoadMore() {
    if (this.isLoadingMore()) {
      return;
    }
    this.isLoadingMore.set(true);
    this.loadPage();
  }

  onSubmit() {
    const body = this.newCommentBody.trim();
    if (!body || this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    this.postService.createComment(this.publicId(), body).subscribe({
      next: (comment) => {
        this.pagination.data.set([comment, ...this.pagination.data()]);
        this.newCommentBody = '';
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  onDelete(comment: Comment) {
    const index = this.pagination.data().indexOf(comment);
    this.pagination.data.update(curr => curr.filter((c) => c.id !== comment.id));
    this.postService.deleteComment(this.publicId(), comment.id).subscribe({
      error: () => {
        const restored = [...this.pagination.data()];
        restored.splice(index, 0, comment);
        this.pagination.data.set(restored);
      }
    });
  }

  private loadPage() {
    this.postService.getComments(this.publicId(), this.pagination.cursor).subscribe({
      next: (page) => {
        const comments = page.items.filter((comment) => {
          return !(this.pagination.data().some((item) => comment.id === item.id));
        });
        this.isLoadingMore.set(false);
        this.pagination.update(comments, page.nextCursor);
      },
      error: () => {
        this.isLoadingMore.set(false);
      }
    });
  }
}
