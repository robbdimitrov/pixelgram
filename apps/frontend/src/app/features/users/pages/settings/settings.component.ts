import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {NgClass} from '@angular/common';
import {LucideChevronRight} from '@lucide/angular';

import {UserService} from '../../services/user.service';
import {AuthService} from '../../../auth/services/auth.service';
import {SessionService} from '../../../auth/session.service';
import {ThemePreference, ThemeService} from '../../../../core/theme.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  standalone: true,
  imports: [RouterLink, NgClass, LucideChevronRight]
})
export class SettingsComponent {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private session = inject(SessionService);
  theme = inject(ThemeService);

  userId() {
    return this.session.userId();
  }

  onLogoutClick() {
    const clearAndRedirect = () => {
      this.session.clear();
      this.router.navigate(['/']);
    };
    this.authService.logoutUser().subscribe({
      next: clearAndRedirect,
      error: clearAndRedirect
    });
  }

  setTheme(theme: ThemePreference) {
    this.theme.setPreference(theme);
  }
}
