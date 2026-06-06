import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';
import {LucideChevronRight} from '@lucide/angular';

import {APIClient} from '../../services/api-client.service';
import {HttpCacheService} from '../../services/http-cache.service';
import {SessionService} from '../../services/session.service';
import {ThemePreference, ThemeService} from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  standalone: true,
  imports: [RouterLink, NgClass, LucideChevronRight]
})
export class SettingsComponent {
  private apiClient = inject(APIClient);
  private router = inject(Router);
  private cache = inject(HttpCacheService);
  private session = inject(SessionService);
  theme = inject(ThemeService);

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
