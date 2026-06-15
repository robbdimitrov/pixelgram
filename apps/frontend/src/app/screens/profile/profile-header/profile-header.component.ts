import {Component, inject, input, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {LucideSettings} from '@lucide/angular';
import {finalize} from 'rxjs';

import {User} from '../../../models/user.model';
import {APIClient} from '../../../services/api-client.service';
import {SessionService} from '../../../services/session.service';
import {ImagePipe} from '../../../shared/pipes/image.pipe';
import {PluralizePipe} from '../../../shared/pipes/pluralize.pipe';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  standalone: true,
  imports: [RouterLink, ImagePipe, PluralizePipe, LucideSettings]
})
export class ProfileHeaderComponent {
  private session = inject(SessionService);
  private apiClient = inject(APIClient);

  user = input.required<User>();
  isFollowPending = signal(false);

  isCurrentUser() {
    return this.session.userId() === this.user().id;
  }

  toggleFollow() {
    const user = this.user();
    if (this.isCurrentUser() || this.isFollowPending()) {
      return;
    }
    this.isFollowPending.set(true);

    if (user.isFollowing) {
      user.isFollowing = false;
      user.followers -= 1;
      this.apiClient.unfollowUser(user.id).pipe(
        finalize(() => this.isFollowPending.set(false))
      ).subscribe({
        error: () => {
          user.isFollowing = true;
          user.followers += 1;
        }
      });
    } else {
      user.isFollowing = true;
      user.followers += 1;
      this.apiClient.followUser(user.id).pipe(
        finalize(() => this.isFollowPending.set(false))
      ).subscribe({
        error: () => {
          user.isFollowing = false;
          user.followers -= 1;
        }
      });
    }
  }
}
