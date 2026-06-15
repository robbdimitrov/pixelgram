import {Component, inject, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {PostService} from '../../services/post.service';
import {Post} from '../../../posts/models/post.model';
import {PaginationService} from '../../../../shared/services/pagination.service';
import {PostComponent} from './post/post.component';
import {EmptyStateComponent} from '../../../../shared/ui/components/empty-state.component';

@Component({
  templateUrl: './feed.component.html',
  providers: [PaginationService],
  standalone: true,
  imports: [PostComponent, EmptyStateComponent]
})
export class FeedComponent {
  private postService = inject(PostService);
  private pagination = inject<PaginationService<Post>>(PaginationService);
  private router = inject(Router);

  username = signal<string | undefined>(undefined);
  publicId = signal<string | undefined>(undefined);
  hasLoaded = signal(false);
  isLoadingNextPage = signal(false);
  private routeVersion = 0;

  constructor() {
    inject(ActivatedRoute).params.pipe(takeUntilDestroyed()).subscribe((params) => {
      const routeVersion = ++this.routeVersion;
      this.pagination.reset();
      this.hasLoaded.set(false);
      this.isLoadingNextPage.set(false);

      if (params['publicId']) {
        const publicId = params['publicId'];
        this.publicId.set(publicId);
        this.username.set(undefined);
        this.loadPost(publicId, routeVersion);
      } else {
        this.publicId.set(undefined);
        this.username.set(params['username']);
        this.loadNextPage(routeVersion);
      }
    });
  }

  loadNextPage(routeVersion = this.routeVersion) {
    if (this.isLoadingNextPage()) {
      return;
    }
    this.isLoadingNextPage.set(true);

    const username = this.username();
    const req = (username ?
      this.postService.getLikedPosts(username, this.pagination.cursor) :
      this.postService.getFeed(this.pagination.cursor));

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

  loadPost(publicId: string, routeVersion = this.routeVersion) {
    this.postService.getPost(publicId).subscribe({
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
    return this.username() !== undefined;
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

  onLike(publicId: string) {
    this.postService.likePost(publicId).subscribe({
      error: () => {
        this.revertLike(publicId, false);
      }
    });
  }

  onUnlike(publicId: string) {
    const post = this.pagination.data().find((item) => item.publicId === publicId);
    if (this.isLikesPage() && post) {
      this.pagination.remove(post);
    }

    this.postService.unlikePost(publicId).subscribe({
      error: () => {
        if (this.isLikesPage() && post) {
          post.liked = true;
          post.likes += 1;
          this.pagination.data.set([post, ...this.pagination.data()]);
        } else {
          this.revertLike(publicId, true);
        }
      }
    });
  }

  onNextClick() {
    this.loadNextPage();
  }

  onDeleteAction(post: Post) {
    this.pagination.remove(post);
    this.postService.deletePost(post.publicId).subscribe({
      next: () => {
        if (this.publicId() === post.publicId) {
          this.router.navigate([`/@${post.username}`]);
        }
      },
      error: () => {
        this.pagination.data.set([post, ...this.pagination.data()]);
      }
    });
  }

  private revertLike(publicId: string, liked: boolean) {
    // Replace with a new object so the OnPush post component re-renders.
    this.pagination.data.update((data) => data.map((item) =>
      item.publicId === publicId
        ? {...item, liked, likes: item.likes + (liked ? 1 : -1)}
        : item
    ));
  }
}
