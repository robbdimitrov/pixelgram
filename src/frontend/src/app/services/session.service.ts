import {Injectable} from '@angular/core';
import {ThemeService} from './theme.service';

@Injectable()
export class Session {
  constructor(private themeService: ThemeService) {}

  userId(): number | null {
    const value = localStorage.getItem('userId');
    if (value) {
      return +value;
    }
    return null;
  }

  setUserId(userId: number) {
    localStorage.setItem('userId', userId.toString());
  }

  clear() {
    this.themeService.setPreference('system');
    localStorage.clear();
  }
}
