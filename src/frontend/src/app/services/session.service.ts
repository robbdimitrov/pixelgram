import {Injectable} from '@angular/core';

@Injectable()
export class Session {
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
    localStorage.removeItem('userId');
  }
}
