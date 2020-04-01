import { Injectable } from '@angular/core';

@Injectable()
export class Session {
  userId() {
    return +localStorage.getItem('userId');
  }

  setUserId(userId: number) {
    localStorage.setItem('userId', userId.toString());
  }

  reset() {
    localStorage.removeItem('userId');
  }
}
