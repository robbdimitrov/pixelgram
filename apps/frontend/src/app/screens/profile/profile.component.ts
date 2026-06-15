import {Component, inject, signal} from '@angular/core';
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

  user = signal<User | undefined>(undefined);
  hasLoadedPosts = signal(false);
  isLoadingNextPage = signal(false);
  private routeVersion = 0;

  constructor() {
    inject(ActivatedRoute).params.pipe(takeUntilDestroyed()).subscribe((params) => {
      const routeVersion = ++this.routeVersion;
      const username = params['username'];
      this.user.set(undefined);
      this.hasLoadedPosts.set(false);
      this.isLoadingNextPage.set(false);
      this.pagination.reset();

      if (!username) {
        this.hasLoadedPosts.set(true);
        return;
      }

      this.loadUser(username, routeVersion);
    });
  }

  loadUser(username: string, routeVersion = this.routeVersion) {
    this.apiClient.getUserByUsername(username).subscribe({
      next: (value) => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        this.user.set(value);
        this.loadNextPage(routeVersion);
      },
      error: () => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        this.hasLoadedPosts.set(true);
      }
    });
  }

  loadNextPage(routeVersion = this.routeVersion) {
    const user = this.user();
    if (!user || this.isLoadingNextPage()) {
      return;
    }
    this.isLoadingNextPage.set(true);

    this.apiClient.getPosts(user.username, this.pagination.cursor).subscribe({
      next: (page) => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        const posts = page.items.filter((post) => {
          return !(this.pagination.data().some((item) => post.id === item.id));
        });
        this.pagination.update(posts, page.nextCursor);
        this.isLoadingNextPage.set(false);
        this.hasLoadedPosts.set(true);
      },
      error: () => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        this.isLoadingNextPage.set(false);
        this.hasLoadedPosts.set(true);
      }
    });
  }

  posts() {
    return this.pagination.data();
  }

  count() {
    return this.pagination.count();
  }

  hasMore() {
    return this.pagination.hasMore();
  }

  isEmpty() {
    return this.hasLoadedPosts() && this.count() === 0;
  }

  isCurrentUser() {
    const user = this.user();
    if (!user) {
      return false;
    }

    return this.session.userId() === user.id;
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
