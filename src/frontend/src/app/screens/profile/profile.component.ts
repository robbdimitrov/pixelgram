import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

import { Image } from '../../models/image.model';
import {
  APIClient, UserDidLogoutNotification
} from '../../services/api-client.service';
import { PaginationService } from '../../services/pagination.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [PaginationService]
})
export class ProfileComponent implements OnDestroy {
  loginSubscription: Subscription;
  user: User;

  constructor(private apiClient: APIClient, private router: Router,
              private pagination: PaginationService<Image>,
              private route: ActivatedRoute) {
    this.subscribeToLogout();

    this.route.params.subscribe(params => {
      const id = params.id;
      if (!this.user || id !== this.user.id) {
        this.loadUser(id);
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

  ngOnDestroy() {
    this.loginSubscription.unsubscribe();
  }

  // Data

  loadUser(userId: string) {
    this.apiClient.getUser(userId).subscribe(
      (data) => {
        this.user = data;
        this.pagination.reset();
        this.loadNextPage();
      },
      (error) => console.error(`Loading user failed: ${error.message}`)
    );
  }

  loadNextPage() {
    this.apiClient.getImagesByUser(this.user.id, this.pagination.page).subscribe(
      (data) => {
        const images = data.filter((image) => {
          return !(this.pagination.data.some((value) => image.id === value.id));
        });
        this.pagination.update(images);
      },
      (error) => console.error(`Error loading images: ${error.message}`)
    );
  }

  images() {
    return this.pagination.data;
  }

  count() {
    return this.pagination.count();
  }

  // Actions

  onOpenSettings() {
    this.router.navigate(['/account/settings']);
  }

  onOpenEditProfile() {
    this.router.navigate(['/account/edit']);
  }

  onNextClick() {
    this.loadNextPage();
  }

  onOpenImage(imageId: string) {
    this.router.navigate(['/image', imageId]);
  }
}
