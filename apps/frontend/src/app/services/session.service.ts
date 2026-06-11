import {inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

import {ThemeService} from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly userIdKey = 'userId';
  private themeService = inject(ThemeService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
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
    if (!this.isBrowser) return null;
    const value = localStorage.getItem(this.userIdKey);
    return value ? +value : null;
  }

  setUserId(userId: number) {
    if (!this.isBrowser) return;
    localStorage.setItem(this.userIdKey, userId.toString());
  }

  clear() {
    this.themeService.setPreference('system');
    if (!this.isBrowser) return;
    localStorage.removeItem(this.userIdKey);
  }
}
