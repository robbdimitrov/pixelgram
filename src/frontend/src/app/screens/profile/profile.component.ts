import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

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
  user?: User;
  hasLoadedPosts = false;
  isLoadingNextPage = false;

  constructor(
    private apiClient: APIClient,
    private pagination: PaginationService<Post>,
    private route: ActivatedRoute,
    private session: SessionService
  ) {
    this.route.params.subscribe((params) => {
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
      },
      error: (error) => console.error(`Loading user failed: ${error.message}`)
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
      error: (error) => {
        this.isLoadingNextPage = false;
        this.hasLoadedPosts = true;
        console.error(`Error loading posts: ${error.message}`);
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
