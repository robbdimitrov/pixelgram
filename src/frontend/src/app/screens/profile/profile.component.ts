import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {Image} from '../../models/image.model';
import {APIClient} from '../../services/api-client.service';
import {PaginationService} from '../../services/pagination.service';
import {SessionService} from '../../services/session.service';
import {User} from '../../models/user.model';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    providers: [PaginationService],
    standalone: false
})
export class ProfileComponent {
  user?: User;
  hasLoadedImages = false;
  isLoadingNextPage = false;

  constructor(
    private apiClient: APIClient,
    private pagination: PaginationService<Image>,
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
        this.hasLoadedImages = false;
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

    this.apiClient.getImages(this.user.id, this.pagination.page).subscribe({
      next: (value) => {
        this.isLoadingNextPage = false;
        const images = value.filter((image) => {
          return !(this.pagination.data.some((item) => image.id === item.id));
        });
        this.pagination.update(images, value.length);
        this.hasLoadedImages = true;
      },
      error: (error) => {
        this.isLoadingNextPage = false;
        this.hasLoadedImages = true;
        console.error(`Error loading images: ${error.message}`);
      }
    });
  }

  images() {
    return this.pagination.data;
  }

  count() {
    return this.pagination.count();
  }

  hasMore() {
    return this.pagination.hasMore;
  }

  isEmpty() {
    return this.hasLoadedImages && this.count() === 0;
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
