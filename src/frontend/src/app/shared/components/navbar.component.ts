import {Component, ElementRef, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Session} from '../../services/session.service';

type ThemePreference = 'system' | 'light' | 'dark';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    standalone: false
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly themeOptions: ThemePreference[] = ['system', 'light', 'dark'];
  isDarkMode = false;
  themePreference: ThemePreference = 'system';
  isThemeMenuOpen = false;
  private systemThemeQuery?: MediaQueryList;
  private readonly systemThemeListener = (event: MediaQueryListEvent) => {
    if (this.themePreference === 'system') {
      this.isDarkMode = event.matches;
      this.applyTheme();
    }
  };

  constructor(private session: Session, public router: Router, private elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event.target'])
  closeMenusOnOutsideClick(target: EventTarget | null) {
    if (target instanceof Node && this.elementRef.nativeElement.contains(target)) {
      return;
    }

    this.isThemeMenuOpen = false;
  }

  ngOnInit() {
    this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
    this.themePreference = this.savedThemePreference();
    this.updateThemeMode();
  }

  ngOnDestroy() {
    this.systemThemeQuery?.removeEventListener('change', this.systemThemeListener);
  }

  toggleTheme() {
    const nextTheme = this.themePreference === 'system'
      ? 'light'
      : this.themePreference === 'light' ? 'dark' : 'system';
    this.setThemePreference(nextTheme);
  }

  setThemePreference(theme: ThemePreference) {
    this.themePreference = theme;
    localStorage.setItem('theme', theme);
    this.isThemeMenuOpen = false;
    this.updateThemeMode();
  }

  updateThemeMode() {
    this.isDarkMode = this.themePreference === 'system'
      ? Boolean(this.systemThemeQuery?.matches)
      : this.themePreference === 'dark';
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

  themeTitle() {
    if (this.themePreference === 'system') {
      return `System theme (${this.isDarkMode ? 'dark' : 'light'})`;
    }

    return `${this.themePreference === 'dark' ? 'Dark' : 'Light'} theme`;
  }

  themeOptionTitle(theme: ThemePreference) {
    return theme[0].toUpperCase() + theme.slice(1);
  }

  themeOptionActive(theme: ThemePreference) {
    return this.themePreference === theme;
  }

  private savedThemePreference(): ThemePreference {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
      ? savedTheme
      : 'system';
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
