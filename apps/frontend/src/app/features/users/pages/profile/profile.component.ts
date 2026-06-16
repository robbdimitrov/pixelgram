import {Component, inject, signal} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {finalize} from 'rxjs';

import {Post} from '../../../posts/models/post.model';
import {UserService} from '../../services/user.service';
import {PostService} from '../../../posts/services/post.service';
import {PaginationService} from '../../../../shared/services/pagination.service';
import {SessionService} from '../../../auth/session.service';
import {User} from '../../models/user.model';
import {ProfileHeaderComponent} from './profile-header/profile-header.component';
import {ThumbnailComponent} from './thumbnail/thumbnail.component';
import {EmptyStateComponent} from '../../../../shared/ui/components/empty-state.component';
import {ImagePipe} from '../../../../shared/ui/pipes/image.pipe';
import {AvatarStyleDirective} from '../../../../shared/ui/directives/avatar-style.directive';

type ProfileMode = 'posts' | 'followers' | 'following';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  providers: [PaginationService],
  standalone: true,
  imports: [ProfileHeaderComponent, ThumbnailComponent, EmptyStateComponent, RouterLink, ImagePipe, AvatarStyleDirective]
})
export class ProfileComponent {
  private userService = inject(UserService);
  private postService = inject(PostService);
  private postPagination = inject<PaginationService<Post>>(PaginationService);
  private userPagination = new PaginationService<User>();
  private session = inject(SessionService);

  user = signal<User | undefined>(undefined);
  profileMode = signal<ProfileMode>('posts');
  hasLoadedPosts = signal(false);
  isLoadingNextPage = signal(false);
  pendingFollowUserIds = signal(new Set<number>());
  private routeVersion = 0;

  constructor() {
    inject(ActivatedRoute).params.pipe(takeUntilDestroyed()).subscribe((params) => {
      const routeVersion = ++this.routeVersion;
      const username = params['username'];
      const mode = this.parseMode(params['mode']);
      this.profileMode.set(mode);
      this.user.set(undefined);
      this.hasLoadedPosts.set(false);
      this.isLoadingNextPage.set(false);
      this.postPagination.reset();
      this.userPagination.reset();

      if (!username) {
        this.hasLoadedPosts.set(true);
        return;
      }

      this.loadUser(username, routeVersion);
    });
  }

  loadUser(username: string, routeVersion = this.routeVersion) {
    this.userService.getUserByUsername(username).subscribe({
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

    if (this.profileMode() === 'posts') {
      this.loadNextPostPage(user, routeVersion);
      return;
    }

    this.loadNextUserPage(user, routeVersion);
  }

  private loadNextPostPage(user: User, routeVersion: number) {
    this.postService.getPosts(user.username, this.postPagination.cursor).subscribe({
      next: (page) => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        const posts = page.items.filter((post) => {
          return !(this.postPagination.data().some((item) => post.id === item.id));
        });
        this.postPagination.update(posts, page.nextCursor);
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

  private loadNextUserPage(user: User, routeVersion: number) {
    const request = this.profileMode() === 'followers'
      ? this.userService.getFollowers(user.username, this.userPagination.cursor)
      : this.userService.getFollowing(user.username, this.userPagination.cursor);

    request.subscribe({
      next: (page) => {
        if (routeVersion !== this.routeVersion) {
          return;
        }
        const users = page.items.filter((item) => {
          return !(this.userPagination.data().some((existing) => item.id === existing.id));
        });
        this.userPagination.update(users, page.nextCursor);
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
    return this.postPagination.data();
  }

  users() {
    return this.userPagination.data();
  }

  count() {
    return this.profileMode() === 'posts' ? this.postPagination.count() : this.userPagination.count();
  }

  hasMore() {
    return this.profileMode() === 'posts' ? this.postPagination.hasMore() : this.userPagination.hasMore();
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

  emptyListTitle() {
    return this.profileMode() === 'followers' ? 'No followers yet' : 'Not following anyone yet';
  }

  emptyListDescription() {
    return this.profileMode() === 'followers'
      ? 'Followers will appear here as people follow this profile.'
      : 'Profiles this user follows will appear here.';
  }

  tabRoute(mode: ProfileMode) {
    const user = this.user();
    if (!user || mode === 'posts') {
      return user ? `/@${user.username}` : '/feed';
    }
    return `/@${user.username}/${mode}`;
  }

  isPendingFollow(user: User) {
    return this.pendingFollowUserIds().has(user.id);
  }

  isCurrentListUser(user: User) {
    return this.session.userId() === user.id;
  }

  toggleListFollow(user: User) {
    if (this.isCurrentListUser(user) || this.isPendingFollow(user)) {
      return;
    }

    this.setFollowPending(user.id, true);
    const wasFollowing = user.isFollowing;
    this.applyFollowState(user, !wasFollowing);
    const request = wasFollowing ? this.userService.unfollowUser(user.id) : this.userService.followUser(user.id);

    request.pipe(finalize(() => this.setFollowPending(user.id, false))).subscribe({
      error: () => this.applyFollowState(user, wasFollowing)
    });
  }

  onNextClick() {
    this.loadNextPage();
  }

  private parseMode(value: string | undefined): ProfileMode {
    return value === 'followers' || value === 'following' ? value : 'posts';
  }

  private setFollowPending(userId: number, pending: boolean) {
    this.pendingFollowUserIds.update((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }

  private applyFollowState(user: User, isFollowing: boolean) {
    if (user.isFollowing === isFollowing) {
      return;
    }
    user.isFollowing = isFollowing;
    user.followers += isFollowing ? 1 : -1;
    if (this.isCurrentUser()) {
      this.updateProfileFollowingCount(isFollowing ? 1 : -1);
    }
  }

  private updateProfileFollowingCount(delta: number) {
    this.user.update((profileUser) => {
      if (!profileUser) {
        return profileUser;
      }
      return new User(
        profileUser.id,
        profileUser.name,
        profileUser.username,
        profileUser.email,
        profileUser.avatar,
        profileUser.bio,
        profileUser.posts,
        profileUser.likes,
        profileUser.followers,
        profileUser.following + delta,
        profileUser.isFollowing,
        profileUser.created
      );
    });
  }
}
