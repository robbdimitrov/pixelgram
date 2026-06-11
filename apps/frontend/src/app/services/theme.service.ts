import {afterNextRender, inject, Injectable, PLATFORM_ID, REQUEST} from '@angular/core';
import {isPlatformBrowser, isPlatformServer, DOCUMENT} from '@angular/common';

export type ThemePreference = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly options: ThemePreference[] = ['system', 'light', 'dark'];
  preference: ThemePreference = 'system';
  isDarkMode = false;

  private readonly doc = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private systemThemeQuery?: MediaQueryList;
  private readonly systemThemeListener = (event: MediaQueryListEvent) => {
    if (this.preference === 'system') {
      this.isDarkMode = event.matches;
      this.applyTheme();
    }
  };

  constructor() {
    if (isPlatformServer(this.platformId)) {
      const request = inject(REQUEST, {optional: true});
      const cookieHeader = request?.headers.get('cookie') ?? '';
      const match = /(?:^|;\s*)theme=([^;]+)/.exec(cookieHeader);
      const saved = match?.[1] as ThemePreference | undefined;
      this.preference = saved === 'light' || saved === 'dark' || saved === 'system'
        ? saved
        : 'system';
      this.isDarkMode = this.preference === 'dark';
      this.applyTheme();
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.systemThemeQuery.addEventListener('change', this.systemThemeListener);
        this.preference = this.savedThemePreference();
        this.updateThemeMode();
      });
    }
  }

  setPreference(theme: ThemePreference) {
    this.preference = theme;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', theme);
      this.doc.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
    }
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
    this.doc.documentElement.setAttribute('data-theme', theme);
    if (this.isDarkMode) {
      this.doc.documentElement.classList.add('dark');
    } else {
      this.doc.documentElement.classList.remove('dark');
    }
  }

  private savedThemePreference(): ThemePreference {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
      ? savedTheme
      : 'system';
  }
}
