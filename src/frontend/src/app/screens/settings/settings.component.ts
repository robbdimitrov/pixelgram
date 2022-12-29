import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {APIClient} from '../../services/api-client.service';
import {HttpCacheService} from 'src/app/services/http-cache.service';
import {Session} from '../../services/session.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  constructor(
    private apiClient: APIClient,
    private router: Router,
    private cache: HttpCacheService,
    private session: Session
  ) {}

  userId() {
    return this.session.userId();
  }

  onLogoutClick() {
    this.apiClient.logoutUser().subscribe(() => {
      this.cache.clear();
      this.session.clear();
      this.router.navigate(['/']);
    });
  }
}
