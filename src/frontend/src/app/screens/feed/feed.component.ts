import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

import {
  APIClient, UserDidLogoutNotification
} from '../../services/api-client.service';
import { Image } from '../../models/image.model';
import { PaginationService } from '../../services/pagination.service';
import { Session } from '../../services/session.service';

@Component({
  templateUrl: './feed.component.html',
  styleUrls: ['feed.component.scss'],
  providers: [PaginationService]
})
export class FeedComponent implements AfterViewInit, OnDestroy {
  isSingleImageMode = false;
  userId?: string;
  loginSubscription: Subscription;

  constructor(private apiClient: APIClient, private router: Router,
              private pagination: PaginationService<Image>,
              private session: Session, private route: ActivatedRoute,
              private location: Location) {

    this.subscribeToLogout();

    this.route.params.subscribe(params => {
      if (params.id) {
        const id = params.id;
        this.isSingleImageMode = true;
        this.loadImage(id);
      } else if (params.userId) {
        this.userId = params.userId;
      }
    });
  }

  // Subscriptions

  private subscribeToLogout() {
    this.loginSubscription = this.apiClient.loginSubject.subscribe(
      (value) => {
        if (value === UserDidLogoutNotification) {
          this.pagination.reset();
          this.router.navigate(['/login']);
        }
      }
    );
  }

  // Component lifecycle

  ngAfterViewInit() {
    if (!this.isSingleImageMode) {
      this.loadNextPage();
    }
  }

  ngOnDestroy() {
    this.loginSubscription.unsubscribe();
  }

  // Data

  loadNextPage() {
    const req = (this.userId ?
      this.apiClient.getImagesLikedByUser(this.userId, this.pagination.page) :
      this.apiClient.getAllImages(this.pagination.page));

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

  loadImage(imageId: string) {
    this.apiClient.getImage(imageId).subscribe(
      (data) => this.pagination.update([data]),
      (error) => console.error(`Loading user failed: ${error.message}`)
    );
  }

  images() {
    return this.pagination.data;
  }

  count() {
    return this.pagination.count();
  }

  // Actions

  onLike(imageId: string) {
    this.apiClient.likeImage(imageId).subscribe();
  }

  onUnlike(imageId: string) {
    this.apiClient.unlikeImage(this.session.userId(), imageId).subscribe();
  }

  onShowProfile(userId: string) {
    this.router.navigate(['/user', userId]);
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
