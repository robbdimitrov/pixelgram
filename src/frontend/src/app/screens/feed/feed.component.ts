import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {APIClient} from '../../services/api-client.service';
import {Image} from '../../models/image.model';
import {PaginationService} from '../../services/pagination.service';

@Component({
    templateUrl: './feed.component.html',
    providers: [PaginationService],
    standalone: false
})
export class FeedComponent {
  userId?: number;
  imageId?: number;
  hasLoaded = false;

  constructor(
    private apiClient: APIClient,
    private pagination: PaginationService<Image>,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe((params) => {
      if (params['imageId']) {
        this.imageId = Number(params['imageId']);
        this.userId = undefined;
        this.loadImage(params['imageId']);
      } else {
        this.imageId = undefined;
        this.userId = params['userId'];
        this.loadNextPage();
      }
    });
  }

  loadNextPage() {
    const req = (this.userId ?
      this.apiClient.getLikedImages(this.userId, this.pagination.page) :
      this.apiClient.getFeed(this.pagination.page));

    req.subscribe({
      next: (value) => {
        const images = value.filter((image) => {
          return !(this.pagination.data.some((item) => image.id === item.id));
        });
        this.pagination.update(images);
        this.hasLoaded = true;
      },
      error: (error) => {
        this.hasLoaded = true;
        console.error(`Error loading images: ${error.message}`);
      }
    });
  }

  loadImage(imageId: number) {
    this.apiClient.getImage(imageId).subscribe({
      next: (value) => {
        this.pagination.update([value]);
        this.hasLoaded = true;
      },
      error: (error) => {
        this.hasLoaded = true;
        console.error(`Loading image failed: ${error.message}`);
      }
    });
  }

  images() {
    return this.pagination.data;
  }

  count() {
    return this.pagination.count();
  }

  isEmpty() {
    return this.hasLoaded && this.count() === 0;
  }

  isLikesPage() {
    return this.userId !== undefined;
  }

  emptyStateTitle() {
    return this.isLikesPage() ? 'No liked posts yet' : 'No posts yet';
  }

  emptyStateDescription() {
    if (this.isLikesPage()) {
      return 'Liked photos will appear here so they are easy to find again.';
    }

    return 'Your feed is empty. Upload the first photo to start filling PixelGram.';
  }

  onLike(imageId: number) {
    this.apiClient.likeImage(imageId).subscribe({
      error: (error) => {
        this.revertLike(imageId, false);
        console.error(`Liking image failed: ${error.message}`);
      }
    });
  }

  onUnlike(imageId: number) {
    this.apiClient.unlikeImage(imageId).subscribe({
      error: (error) => {
        this.revertLike(imageId, true);
        console.error(`Unliking image failed: ${error.message}`);
      }
    });
  }

  onNextClick() {
    this.loadNextPage();
  }

  onDeleteAction(image: Image) {
    this.pagination.remove(image);
    this.apiClient.deleteImage(image.id).subscribe({
      next: () => {
        if (this.imageId === image.id) {
          this.router.navigate([`/users/${image.userId}`]);
        }
      },
      error: (error) => console.error(`Deleting image failed: ${error.message}`)
    });
  }

  private revertLike(imageId: number, liked: boolean) {
    const image = this.pagination.data.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    image.liked = liked;
    image.likes += liked ? 1 : -1;
  }
}
