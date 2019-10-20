import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

import { Image } from '../../models/image.model';
import { APIClient, UserDidLogoutNotification } from '../../services/api-client.service';
import { Session } from '../../services/session.service';
import { UserCache } from '../../services/user-cache.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'pg-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnDestroy {
  images: Image[] = [];
  page = 0;
  loginSubscription: Subscription;
  user: User;

  constructor(private apiClient: APIClient, private router: Router,
              private userCache: UserCache, private session: Session,
              private route: ActivatedRoute) {
    this.subscribeToLogout();

    this.route.params.subscribe(params => {
      const id = params.id;
      if (!this.user || id !== this.user.id) {
        this.page = 0;
        this.images = [];
        this.loadUser(id);
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

  ngOnDestroy() {
    this.loginSubscription.unsubscribe();
  }

  // Data

  loadUser(userId: string) {
    this.apiClient.getUser(userId).then((result) => {
      this.user = result;
      this.loadNextPage();
    }).catch((error) => {
      console.log(`Loading user failed: ${error}`);
    });
  }

  loadNextPage() {
    this.apiClient.getUsersImages(this.user.id, this.page).then((result) => {
      if (result.length) {
        this.images.push(...result);
        this.page += 1;
      }
    }).catch((error) => {
      console.log(`Error loading images: ${error}`);
    });
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
