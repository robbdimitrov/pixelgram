import {Component} from '@angular/core';
import {Router} from '@angular/router';

import {APIClient} from '../../services/api-client.service';
import {HttpCacheService} from '../../services/http-cache.service';
import {Session} from '../../services/session.service';
import {ThemePreference, ThemeService} from '../../services/theme.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    standalone: false
})
export class SettingsComponent {
  constructor(
    private apiClient: APIClient,
    private router: Router,
    private cache: HttpCacheService,
    private session: Session,
    public theme: ThemeService
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

  setTheme(theme: ThemePreference) {
    this.theme.setPreference(theme);
  }
}
