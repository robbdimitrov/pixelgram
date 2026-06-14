import {inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

import {ThemeService} from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly userIdKey = 'userId';
  private themeService = inject(ThemeService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly userId = signal(this.storedUserId());
  private _isClearing = false;

  startClearing(): boolean {
    if (this._isClearing) return false;
    this._isClearing = true;
    return true;
  }

  stopClearing() {
    this._isClearing = false;
  }

  setUserId(userId: number) {
    if (!this.isBrowser) return;
    localStorage.setItem(this.userIdKey, userId.toString());
    this.userId.set(userId);
  }

  clear() {
    this.themeService.setPreference('system');
    if (!this.isBrowser) return;
    localStorage.removeItem(this.userIdKey);
    this.userId.set(null);
  }

  private storedUserId(): number | null {
    if (!this.isBrowser) return null;
    const value = localStorage.getItem(this.userIdKey);
    if (!value) return null;

    const userId = Number(value);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  }
}
