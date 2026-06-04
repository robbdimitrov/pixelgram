import {Component, Input, OnInit} from '@angular/core';

import {APIClient} from '../../../services/api-client.service';
import {SessionService} from '../../../services/session.service';
import {PaginationService} from '../../../services/pagination.service';
import {Comment} from '../../../models/comment.model';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  providers: [PaginationService],
  standalone: false
})
export class CommentsComponent implements OnInit {
  @Input() imageId: number;

  newCommentBody = '';
  isSubmitting = false;
  isLoadingMore = false;

  constructor(
    private apiClient: APIClient,
    private session: SessionService,
    private pagination: PaginationService<Comment>
  ) {}

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
    this.apiClient.createComment(this.imageId, body).subscribe({
      next: (comment) => {
        this.pagination.data = [...this.pagination.data, comment];
        this.newCommentBody = '';
        this.isSubmitting = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error(`Failed to post comment: ${error.message}`);
      }
    });
  }

  onDelete(comment: Comment) {
    this.pagination.data = this.pagination.data.filter((c) => c.id !== comment.id);
    this.apiClient.deleteComment(this.imageId, comment.id).subscribe({
      error: (error) => {
        this.pagination.data = [...this.pagination.data, comment]
          .sort((a, b) => a.created.getTime() - b.created.getTime());
        console.error(`Failed to delete comment: ${error.message}`);
      }
    });
  }

  private loadPage() {
    this.apiClient.getComments(this.imageId, this.pagination.page).subscribe({
      next: (items) => {
        this.isLoadingMore = false;
        this.pagination.update(items, items.length);
      },
      error: (error) => {
        this.isLoadingMore = false;
        console.error(`Failed to load comments: ${error.message}`);
      }
    });
  }
}
