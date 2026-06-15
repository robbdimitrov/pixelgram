import {Component, inject, input, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {LucideSettings} from '@lucide/angular';
import {finalize} from 'rxjs';

import {User} from '../../../models/user.model';
import {UserService} from '../../../services/user.service';
import {SessionService} from '../../../../auth/session.service';
import {ImagePipe} from '../../../../../shared/ui/pipes/image.pipe';
import {PluralizePipe} from '../../../../../shared/ui/pipes/pluralize.pipe';
import {AvatarStyleDirective} from '../../../../../shared/ui/directives/avatar-style.directive';

@Component({
  selector: 'app-profile-header',
  templateUrl: './profile-header.component.html',
  standalone: true,
  imports: [RouterLink, ImagePipe, PluralizePipe, LucideSettings, AvatarStyleDirective]
})
export class ProfileHeaderComponent {
  private session = inject(SessionService);
  private userService = inject(UserService);

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
      this.userService.unfollowUser(user.id).pipe(
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
      this.userService.followUser(user.id).pipe(
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
