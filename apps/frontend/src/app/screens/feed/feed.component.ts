import {Component, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {APIClient} from '../../services/api-client.service';
import {Post} from '../../models/post.model';
import {User} from '../../models/user.model';
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

  userId?: number;
  postId?: number;
  hasLoaded = false;
  isLoadingNextPage = false;
  users: Record<number, User> = {};

  constructor() {
    inject(ActivatedRoute).params.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (params['postId']) {
        const postId = Number(params['postId']);
        if (!Number.isSafeInteger(postId) || postId <= 0) {
          this.postId = undefined;
          this.userId = undefined;
          this.hasLoaded = true;
          this.pagination.reset();
          return;
        }

        this.postId = postId;
        this.userId = undefined;
        this.loadPost(postId);
      } else {
        const userId = params['userId'] ? Number(params['userId']) : undefined;
        if (userId !== undefined && (!Number.isSafeInteger(userId) || userId <= 0)) {
          this.postId = undefined;
          this.userId = undefined;
          this.hasLoaded = true;
          this.pagination.reset();
          return;
        }

        this.postId = undefined;
        this.userId = userId;
        this.loadNextPage();
      }
    });
  }

  loadNextPage() {
    if (this.isLoadingNextPage) {
      return;
    }
    this.isLoadingNextPage = true;

    const req = (this.userId ?
      this.apiClient.getLikedPosts(this.userId, this.pagination.page) :
      this.apiClient.getFeed(this.pagination.page));

    req.subscribe({
      next: (value) => {
        console.log('FEED REQUEST SUCCESS', value);
        this.isLoadingNextPage = false;
        const posts = value.filter((post) => {
          return !(this.pagination.data.some((item) => post.id === item.id));
        });
        this.pagination.update(posts, value.length);
        this.hasLoaded = true;
        this.loadMissingUsers(posts);
      },
      error: (err) => {
        console.log('FEED REQUEST ERROR', err);
        this.isLoadingNextPage = false;
        this.hasLoaded = true;
      }
    });
  }

  loadPost(postId: number) {
    this.apiClient.getPost(postId).subscribe({
      next: (value) => {
        this.pagination.data = [value];
        this.hasLoaded = true;
        this.loadMissingUsers([value]);
      },
      error: () => {
        this.hasLoaded = true;
      }
    });
  }

  private loadMissingUsers(posts: Post[]) {
    const missing = [...new Set(posts.map((p) => p.userId))].filter((id) => !this.users[id]);
    for (const id of missing) {
      this.apiClient.getUser(id).subscribe({
        next: (user) => { this.users = {...this.users, [user.id]: user}; },
        error: () => {}
      });
    }
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
    return this.hasLoaded && this.count() === 0;
  }

  isLikesPage() {
    return this.userId !== undefined;
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
    const post = this.pagination.data.find((item) => item.id === postId);
    if (this.isLikesPage() && post) {
      this.pagination.remove(post);
    }

    this.apiClient.unlikePost(postId).subscribe({
      error: () => {
        if (this.isLikesPage() && post) {
          post.liked = true;
          post.likes += 1;
          this.pagination.data = [post, ...this.pagination.data];
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
        if (this.postId === post.id) {
          this.router.navigate([`/users/${post.userId}`]);
        }
      },
      error: () => {
        this.pagination.data = [post, ...this.pagination.data];
      }
    });
  }

  private revertLike(postId: number, liked: boolean) {
    const post = this.pagination.data.find((item) => item.id === postId);
    if (!post) {
      return;
    }

    post.liked = liked;
    post.likes += liked ? 1 : -1;
  }
}
