import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Session} from '../../services/session.service';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    standalone: false
})
export class NavbarComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  private systemThemeQuery?: MediaQueryList;
  private readonly systemThemeListener = (event: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      this.isDarkMode = event.matches;
      this.applyTheme();
    }
  };

  constructor(private session: Session, public router: Router) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkMode = this.systemThemeQuery.matches;
      this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
    }
    this.applyTheme();
  }

  ngOnDestroy() {
    this.systemThemeQuery?.removeEventListener('change', this.systemThemeListener);
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    const theme = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  authNavTitle() {
    return this.isSignupRoute() ? 'Log In' : 'Sign Up';
  }
}
