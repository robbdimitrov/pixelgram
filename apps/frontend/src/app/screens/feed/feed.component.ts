import {Component, inject, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {APIClient} from '../../services/api-client.service';
import {Post} from '../../models/post.model';
import {PaginationService} from '../../services/pagination.service';
import {PostComponent} from './post/post.component';
import {EmptyStateComponent} from '../../shared/components/empty-state.component';

@Component({
  templateUrl: './feed.component.html',
  providers: [PaginationService],
  standalone: true,
  imports: [PostComponent, EmptyStateComponent]
})
export class FeedComponent {
  private apiClient = inject(APIClient);
  private pagination = inject<PaginationService<Post>>(PaginationService);
  private router = inject(Router);

  userId = signal<number | undefined>(undefined);
  postId = signal<number | undefined>(undefined);
  hasLoaded = signal(false);
  isLoadingNextPage = signal(false);
  private routeVersion = 0;

  constructor() {
    inject(ActivatedRoute).params.pipe(takeUntilDestroyed()).subscribe((params) => {
      const routeVersion = ++this.routeVersion;
      this.pagination.reset();
      this.hasLoaded.set(false);
      this.isLoadingNextPage.set(false);

      if (params['postId']) {
        const postId = Number(params['postId']);
        if (!Number.isSafeInteger(postId) || postId <= 0) {
          this.postId.set(undefined);
          this.userId.set(undefined);
          this.hasLoaded.set(true);
          return;
        }

        this.postId.set(postId);
        this.userId.set(undefined);
        this.loadPost(postId, routeVersion);
      } else {
        const userId = params['userId'] ? Number(params['userId']) : undefined;
        if (userId !== undefined && (!Number.isSafeInteger(userId) || userId <= 0)) {
          this.postId.set(undefined);
          this.userId.set(undefined);
          this.hasLoaded.set(true);
          return;
        }

        this.postId.set(undefined);
        this.userId.set(userId);
        this.loadNextPage(routeVersion);
      }
    });
  }

  loadNextPage(routeVersion = this.routeVersion) {
    if (this.isLoadingNextPage()) {
      return;
    }
    this.isLoadingNextPage.set(true);

    const userId = this.userId();
    const req = (userId ?
      this.apiClient.getLikedPosts(userId, this.pagination.cursor) :
      this.apiClient.getFeed(this.pagination.cursor));

    req.subscribe({
      next: (page) => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        const posts = page.items.filter((post) => {
          return !(this.pagination.data().some((item) => post.id === item.id));
        });
        this.pagination.update(posts, page.nextCursor);
        this.isLoadingNextPage.set(false);
        this.hasLoaded.set(true);
      },
      error: () => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        this.isLoadingNextPage.set(false);
        this.hasLoaded.set(true);
      }
    });
  }

  loadPost(postId: number, routeVersion = this.routeVersion) {
    this.apiClient.getPost(postId).subscribe({
      next: (value) => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        this.pagination.data.set([value]);
        this.hasLoaded.set(true);
      },
      error: () => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        this.hasLoaded.set(true);
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
    return this.hasLoaded() && this.count() === 0;
  }

  isLikesPage() {
    return this.userId() !== undefined;
  }

  emptyStateTitle() {
    return this.isLikesPage() ? 'No liked posts yet' : 'Ready for your first post?';
  }

  emptyStateIcon() {
    return this.isLikesPage() ? 'heart' : 'square-plus';
  }

  emptyStateDescription() {
    if (this.isLikesPage()) {
      return 'Liked photos will appear here so they are easy to find again.';
    }

    return 'Start your PixelGram feed with a photo worth sharing.';
  }

  emptyStateActionLabel() {
    return this.isLikesPage() ? 'Browse Feed' : 'Share Your First Photo';
  }

  emptyStateActionRoute() {
    return this.isLikesPage() ? '/feed' : '/upload';
  }

  onLike(postId: number) {
    this.apiClient.likePost(postId).subscribe({
      error: () => {
        this.revertLike(postId, false);
      }
    });
  }

  onUnlike(postId: number) {
    const post = this.pagination.data().find((item) => item.id === postId);
    if (this.isLikesPage() && post) {
      this.pagination.remove(post);
    }

    this.apiClient.unlikePost(postId).subscribe({
      error: () => {
        if (this.isLikesPage() && post) {
          post.liked = true;
          post.likes += 1;
          this.pagination.data.set([post, ...this.pagination.data()]);
        } else {
          this.revertLike(postId, true);
        }
      }
    });
  }

  onNextClick() {
    this.loadNextPage();
  }

  onDeleteAction(post: Post) {
    this.pagination.remove(post);
    this.apiClient.deletePost(post.id).subscribe({
      next: () => {
        if (this.postId() === post.id) {
          this.router.navigate([`/users/${post.userId}`]);
        }
      },
      error: () => {
        this.pagination.data.set([post, ...this.pagination.data()]);
      }
    });
  }

  private revertLike(postId: number, liked: boolean) {
    // Replace with a new object so the OnPush post component re-renders.
    this.pagination.data.update((data) => data.map((item) =>
      item.id === postId
        ? {...item, liked, likes: item.likes + (liked ? 1 : -1)}
        : item
    ));
  }
}
