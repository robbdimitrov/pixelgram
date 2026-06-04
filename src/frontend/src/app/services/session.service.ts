import {Injectable} from '@angular/core';
import {ThemeService} from './theme.service';

@Injectable()
export class SessionService {
  private readonly userIdKey = 'userId';

  constructor(private themeService: ThemeService) {}

  userId(): number | null {
    const value = localStorage.getItem(this.userIdKey);
    if (value) {
      return +value;
    }
    return null;
  }

  setUserId(userId: number) {
    localStorage.setItem(this.userIdKey, userId.toString());
  }

  clear() {
    this.themeService.setPreference('system');
    localStorage.removeItem(this.userIdKey);
  }
}
