import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { APIClient } from './api-client.service';

@Injectable()
export class UserCache {
  private users = {};

  constructor(private apiClient: APIClient) {}

  userWithId(userId: string): Promise<User> {
    return new Promise((resolve, reject) => {
      const user = this.users[userId];
      if (user) {
        return resolve(user);
      }
      this.apiClient.getUser(userId).subscribe(
        (data) => {
          this.users[userId] = data;
          return resolve(data);
        },
        (error) => {
          console.log('Error getting user');
          reject(error);
        }
      );
    });
  }

  deleteCache() {
    this.users = {};
  }
}
