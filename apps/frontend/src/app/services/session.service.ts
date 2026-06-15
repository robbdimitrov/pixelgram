import {inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';

import {ThemeService} from './theme.service';
import {APIClient} from './api-client.service';
import {User} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private themeService = inject(ThemeService);
  private apiClient = inject(APIClient);
  readonly currentUser = signal<User | null>(null);
  readonly bootstrapped = signal(false);
  private _isClearing = false;
  private bootstrapPromise?: Promise<void>;

  bootstrap(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = firstValueFrom(this.apiClient.getCurrentUser())
        .then((user) => this.currentUser.set(user))
        .catch(() => this.currentUser.set(null))
        .finally(() => this.bootstrapped.set(true));
    }
    return this.bootstrapPromise;
  }

  userId() {
    return this.currentUser()?.id ?? null;
  }

  setCurrentUser(user: User) {
    this.currentUser.set(user);
    this.bootstrapped.set(true);
  }

  startClearing(): boolean {
    if (this._isClearing) return false;
    this._isClearing = true;
    return true;
  }

  stopClearing() {
    this._isClearing = false;
  }

  clear() {
    this.themeService.setPreference('system');
    this.currentUser.set(null);
    this.bootstrapped.set(true);
  }
}
