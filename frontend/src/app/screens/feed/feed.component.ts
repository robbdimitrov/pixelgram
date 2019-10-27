import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

import { APIClient, UserDidLogoutNotification } from '../../services/api-client.service';
import { Image } from '../../models/image.model';
import { UserCache } from '../../services/user-cache.service';
import { Session } from '../../services/session.service';

@Component({
  templateUrl: './feed.component.html',
  styleUrls: ['feed.component.scss']
})
export class FeedComponent implements AfterViewInit, OnDestroy {
  images: Image[] = [];
  page = 0;
  isSingleImageMode = false;
  userId?: string;
  loginSubscription: Subscription;

  constructor(private apiClient: APIClient, private router: Router,
              private userCache: UserCache, private session: Session,
              private route: ActivatedRoute, private location: Location) {

    this.subscribeToLogout();

    this.route.params.subscribe(params => {
      if (params.id !== undefined) {
        const id = params.id;
        this.isSingleImageMode = true;
        this.loadImage(id);
      } else if (params.userId !== undefined) {
        this.userId = params.userId;
      }
    });
  }

  // Subscriptions

  private subscribeToLogout() {
    this.loginSubscription = this.apiClient.loginSubject.subscribe(
      (value) => {
        if (value === UserDidLogoutNotification) {
          this.page = 0;
          this.images = [];
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
      this.apiClient.getUsersLikedImages(this.userId, this.page) :
      this.apiClient.getAllImages(this.page));

    req.subscribe(
      (data) => {
        if (data.length) {
          this.images.push(...data);
          this.page += 1;
        }
      },
      (error) => console.error('Error loading images.')
    );
  }

  loadImage(imageId: string) {
    this.apiClient.getImage(imageId).subscribe(
      (data) => this.images.push(data),
      (error) => console.log(`Loading user failed: ${error}`)
    );
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
    const index = this.images.indexOf(image);

    if (index > -1) {
      this.images.splice(index, 1);
    }

    this.apiClient.deleteImage(image.id).subscribe(
      (data) => {
        if (this.isSingleImageMode && this.images.length === 0) {
          this.location.back();
        }
      },
      (error) => console.log('Deleting image failed.')
    );
  }
}
