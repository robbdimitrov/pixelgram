import {Component, inject, input, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {LucideSend, LucideTrash2} from '@lucide/angular';

import {APIClient} from '../../../services/api-client.service';
import {SessionService} from '../../../services/session.service';
import {PaginationService} from '../../../services/pagination.service';
import {Comment} from '../../../models/comment.model';
import {ImagePipe} from '../../../shared/pipes/image.pipe';
import {RelativeDatePipe} from '../../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  providers: [PaginationService],
  standalone: true,
  imports: [RouterLink, FormsModule, ImagePipe, RelativeDatePipe, LucideSend, LucideTrash2]
})
export class CommentsComponent implements OnInit {
  private apiClient = inject(APIClient);
  private session = inject(SessionService);
  private pagination = inject<PaginationService<Comment>>(PaginationService);

  postId = input.required<number>();

  newCommentBody = '';
  isSubmitting = false;
  isLoadingMore = false;

  ngOnInit() {
    this.loadPage();
  }

  comments() {
    return this.pagination.data;
  }

  hasMore() {
    return this.pagination.hasMore;
  }

  isOwnComment(comment: Comment) {
    return this.session.userId() === comment.userId;
  }

  onLoadMore() {
    if (this.isLoadingMore) {
      return;
    }
    this.isLoadingMore = true;
    this.loadPage();
  }

  onSubmit() {
    const body = this.newCommentBody.trim();
    if (!body || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.apiClient.createComment(this.postId(), body).subscribe({
      next: (comment) => {
        this.pagination.data = [...this.pagination.data, comment];
        this.newCommentBody = '';
        this.isSubmitting = false;
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  onDelete(comment: Comment) {
    const index = this.pagination.data.indexOf(comment);
    this.pagination.data = this.pagination.data.filter((c) => c.id !== comment.id);
    this.apiClient.deleteComment(this.postId(), comment.id).subscribe({
      error: () => {
        const restored = [...this.pagination.data];
        restored.splice(index, 0, comment);
        this.pagination.data = restored;
      }
    });
  }

  private loadPage() {
    this.apiClient.getComments(this.postId(), this.pagination.page).subscribe({
      next: (items) => {
        this.isLoadingMore = false;
        this.pagination.update(items, items.length);
      },
      error: () => {
        this.isLoadingMore = false;
      }
    });
  }
}
