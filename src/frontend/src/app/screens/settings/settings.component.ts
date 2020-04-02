import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { APIClient } from '../../services/api-client.service';
import { CacheService } from 'src/app/services/cache.service';
import { Session } from '../../services/session.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  constructor(private apiClient: APIClient,
              private router: Router,
              private cache: CacheService,
              private session: Session) {}

  onChangePasswordClick() {
    this.router.navigate(['account/change-password']);
  }

  onLikedPostsClick() {
    const userId = this.session.userId();
    this.router.navigate([`/user/${userId}/likes`]);
  }

  onLogoutClick() {
    this.apiClient.logoutUser().subscribe(() => {
      this.cache.clear();
      this.session.clear();
      this.router.navigate(['/']);
    });
  }
}
