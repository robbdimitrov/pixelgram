import {Component, inject} from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {
  LucideCamera,
  LucideHome,
  LucideSquarePlus,
  LucideUser
} from '@lucide/angular';

import {SessionService} from '../../services/session.service';

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
  private session = inject(SessionService);
  router = inject(Router);

  currentUser() {
    return this.session.currentUser();
  }

  isSignupRoute() {
    return this.router.url.startsWith('/signup');
  }
}
