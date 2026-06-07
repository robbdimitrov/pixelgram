import {inject, Injectable} from '@angular/core';
import {ThemeService} from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly userIdKey = 'userId';
  private themeService = inject(ThemeService);
  private _isClearing = false;

  startClearing(): boolean {
    if (this._isClearing) return false;
    this._isClearing = true;
    return true;
  }

  stopClearing() {
    this._isClearing = false;
  }

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
