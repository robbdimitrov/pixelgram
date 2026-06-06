import {Component} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {
  LucideCamera,
  LucideHome,
  LucideSquarePlus,
  LucideUser
} from '@lucide/angular';

import {SessionService} from '../../services/session.service';
import {ThemeService} from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  host: {
    class: 'block'
  },
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideCamera, LucideHome, LucideSquarePlus, LucideUser]
})
export class NavbarComponent {
  constructor(
    private session: SessionService,
    public router: Router,
    theme: ThemeService
  ) {
    void theme;
  }

  userId() {
    return this.session.userId();
  }

  isSignupRoute() {
    return this.router.url.startsWith('/signup');
  }
}
