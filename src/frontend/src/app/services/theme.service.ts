import {Injectable} from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly options: ThemePreference[] = ['system', 'light', 'dark'];
  preference: ThemePreference = 'system';
  isDarkMode = false;
  private systemThemeQuery?: MediaQueryList;
  private readonly systemThemeListener = (event: MediaQueryListEvent) => {
    if (this.preference === 'system') {
      this.isDarkMode = event.matches;
      this.applyTheme();
    }
  };

  constructor() {
    this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
    this.preference = this.savedThemePreference();
    this.updateThemeMode();
  }

  setPreference(theme: ThemePreference) {
    this.preference = theme;
    localStorage.setItem('theme', theme);
    this.updateThemeMode();
  }

  optionTitle(theme: ThemePreference) {
    return theme[0].toUpperCase() + theme.slice(1);
  }

  optionActive(theme: ThemePreference) {
    return this.preference === theme;
  }

  private updateThemeMode() {
    this.isDarkMode = this.preference === 'system'
      ? Boolean(this.systemThemeQuery?.matches)
      : this.preference === 'dark';
    this.applyTheme();
  }

  private applyTheme() {
    const theme = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private savedThemePreference(): ThemePreference {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
      ? savedTheme
      : 'system';
  }
}
