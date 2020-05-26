import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { APIClient } from '../../services/api-client.service';
import { Image } from '../../models/image.model';
import { PaginationService } from '../../services/pagination.service';

@Component({
  templateUrl: './feed.component.html',
  styleUrls: ['feed.component.scss'],
  providers: [PaginationService]
})
export class FeedComponent {
  userId?: number;

  constructor(private apiClient: APIClient,
              private pagination: PaginationService<Image>,
              private router: Router,
              private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      if (params.imageId) {
        this.loadImage(params.imageId);
      } else {
        this.userId = params.userId;
        this.loadNextPage();
      }
    });
  }

  loadNextPage() {
    const req = (this.userId ?
      this.apiClient.getLikedImages(this.userId, this.pagination.page) :
      this.apiClient.getFeed(this.pagination.page));

    req.subscribe(
      (value) => {
        const images = value.filter((image) => {
          return !(this.pagination.data.some((item) => image.id === item.id));
        });
        this.pagination.update(images);
      },
      (error) => console.error(`Error loading images: ${error.message}`)
    );
  }

  loadImage(imageId: number) {
    this.apiClient.getImage(imageId).subscribe(
      (value) => this.pagination.update([value]),
      (error) => console.error(`Loading image failed: ${error.message}`)
    );
  }

  images() {
    return this.pagination.data;
  }

  count() {
    return this.pagination.count();
  }

  onLike(imageId: number) {
    this.apiClient.likeImage(imageId).subscribe();
  }

  onUnlike(imageId: number) {
    this.apiClient.unlikeImage(imageId).subscribe();
  }

  onNextClick() {
    this.loadNextPage();
  }

  onDeleteAction(image: Image) {
    this.pagination.remove(image);
    this.apiClient.deleteImage(image.id).subscribe(
      () => this.router.navigate([`/users/${image.userId}`]),
      (error) => console.error(`Deleting image failed: ${error.message}`)
    );
  }
}
