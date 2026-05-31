import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Session} from '../../services/session.service';
import {ThemeService} from '../../services/theme.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    host: {
      class: 'block'
    },
    standalone: false
})
export class NavbarComponent {
  constructor(
    private session: Session,
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

  authNavRoute() {
    return this.isSignupRoute() ? '/login' : '/signup';
  }
}
