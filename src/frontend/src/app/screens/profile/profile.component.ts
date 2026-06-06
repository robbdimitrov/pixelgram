import {Component, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {Post} from '../../models/post.model';
import {APIClient} from '../../services/api-client.service';
import {PaginationService} from '../../services/pagination.service';
import {SessionService} from '../../services/session.service';
import {User} from '../../models/user.model';
import {ProfileHeaderComponent} from './profile-header/profile-header.component';
import {ThumbnailComponent} from './thumbnail/thumbnail.component';
import {EmptyStateComponent} from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  providers: [PaginationService],
  standalone: true,
  imports: [ProfileHeaderComponent, ThumbnailComponent, EmptyStateComponent]
})
export class ProfileComponent {
  private apiClient = inject(APIClient);
  private pagination = inject<PaginationService<Post>>(PaginationService);
  private session = inject(SessionService);

  user?: User;
  hasLoadedPosts = false;
  isLoadingNextPage = false;

  constructor() {
    inject(ActivatedRoute).params.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (!this.user || params['userId'] !== this.user.id) {
        this.loadUser(params['userId']);
      }
    });
  }

  loadUser(userId: number) {
    this.apiClient.getUser(userId, true).subscribe({
      next: (value) => {
        this.user = value;
        this.hasLoadedPosts = false;
        this.pagination.reset();
        this.loadNextPage();
      }
    });
  }

  loadNextPage() {
    if (!this.user || this.isLoadingNextPage) {
      return;
    }
    this.isLoadingNextPage = true;

    this.apiClient.getPosts(this.user.id, this.pagination.page).subscribe({
      next: (value) => {
        this.isLoadingNextPage = false;
        const posts = value.filter((post) => {
          return !(this.pagination.data.some((item) => post.id === item.id));
        });
        this.pagination.update(posts, value.length);
        this.hasLoadedPosts = true;
      },
      error: () => {
        this.isLoadingNextPage = false;
        this.hasLoadedPosts = true;
      }
    });
  }

  posts() {
    return this.pagination.data;
  }

  count() {
    return this.pagination.count();
  }

  hasMore() {
    return this.pagination.hasMore;
  }

  isEmpty() {
    return this.hasLoadedPosts && this.count() === 0;
  }

  isCurrentUser() {
    if (!this.user) {
      return false;
    }

    return this.session.userId() === this.user.id;
  }

  emptyStateDescription() {
    return this.isCurrentUser()
      ? 'Your profile is ready. Share your first photo to start building your grid.'
      : 'This profile has not shared any photos yet.';
  }

  onNextClick() {
    this.loadNextPage();
  }
}
