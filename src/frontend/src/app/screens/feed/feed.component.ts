import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { APIClient } from '../../services/api-client.service';
import { Image } from '../../models/image.model';
import { PaginationService } from '../../services/pagination.service';

@Component({
  templateUrl: './feed.component.html',
  styleUrls: ['feed.component.scss'],
  providers: [PaginationService]
})
export class FeedComponent implements AfterViewInit {
  isSingleImageMode = false;
  userId?: number;

  constructor(private apiClient: APIClient,
              private pagination: PaginationService<Image>,
              private route: ActivatedRoute,
              private location: Location) {
    this.route.params.subscribe((params) => {
      if (params.id) {
        const id = params.id;
        this.isSingleImageMode = true;
        this.loadImage(id);
      } else if (params.userId) {
        this.userId = params.userId;
      }
    });
  }

  ngAfterViewInit() {
    if (!this.isSingleImageMode) {
      this.loadNextPage();
    }
  }

  loadNextPage() {
    const req = (this.userId ?
      this.apiClient.getLikedImages(this.userId, this.pagination.page) :
      this.apiClient.getFeed(this.pagination.page));

    req.subscribe(
      (data) => {
        const images = data.filter((image) => {
          return !(this.pagination.data.some((value) => image.id === value.id));
        });
        this.pagination.update(images);
      },
      (error) => console.error(`Error loading images: ${error.message}`)
    );
  }

  loadImage(imageId: number) {
    this.apiClient.getImage(imageId).subscribe(
      (data) => this.pagination.update([data]),
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
      (data) => {
        if (this.isSingleImageMode && this.pagination.count() === 0) {
          this.location.back();
        }
      },
      (error) => console.error('Deleting image failed.')
    );
  }
}
