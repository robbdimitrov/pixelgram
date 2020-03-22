import { Injectable } from '@angular/core';

@Injectable()
export class Session {
  userId() {
    return localStorage.getItem('userId');
  }

  setUserId(userId: string) {
    localStorage.setItem('userId', userId);
  }

  reset() {
    localStorage.removeItem('userId');
  }
}
