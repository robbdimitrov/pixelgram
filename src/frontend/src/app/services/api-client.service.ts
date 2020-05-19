import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { mapImage, mapUser } from '../shared/utils/mappers';
import { CacheService } from './cache.service';

@Injectable()
export class APIClient {
  constructor(private http: HttpClient,
              private cache: CacheService) {}

  // Users

  createUser(name: string, username: string, email: string, password: string) {
    const url = '/api/users';
    const body = { name, username, email, password };
    return this.http.post(url, body);
  }

  getUser(userId: number, clearCache = false) {
    const url = `/api/users/${userId}`;
    if (clearCache) {
      this.cache.delete(url);
    }
    return this.http.get(url).pipe(
      map((res: any) => mapUser(res))
    );
  }

  updateUser(userId: number, name: string, username: string,
             email: string, avatar: string, bio: string) {
    const url = `/api/users/${userId}`;
    const body: any = { name, username, email, avatar, bio };
    return this.http.put(url, body);
  }

  changePassword(userId: number, oldPassword: string, password: string) {
    const url = `/api/users/${userId}`;
    const body = { password, oldPassword };
    return this.http.put(url, body);
  }

  // Sessions

  loginUser(email: string, password: string) {
    const url = '/api/sessions';
    const body = { email, password };
    return this.http.post(url, body);
  }

  logoutUser() {
    const url = '/api/sessions';
    return this.http.delete(url);
  }

  // Images

  createImage(filename: string, description: string) {
    const url = '/api/images';
    const body = { filename, description };
    return this.http.post(url, body);
  }

  getFeed(page: number) {
    const url = `/api/images?page=${page}`;
    return this.http.get(url).pipe(
      map((res: any) => res.items.map((item) => mapImage(item)))
    );
  }

  getImages(userId: number, page: number) {
    const url = `/api/users/${userId}/images?page=${page}`;
    return this.http.get(url).pipe(
      map((res: any) => res.items.map((item) => mapImage(item)))
    );
  }

  getLikedImages(userId: number, page: number) {
    const url = `/api/users/${userId}/likes?page=${page}`;
    return this.http.get(url).pipe(
      map((res: any) => res.items.map((item) => mapImage(item)))
    );
  }

  getImage(imageId: number) {
    const url = `/api/images/${imageId}`;
    return this.http.get(url).pipe(
      map((res: any) => mapImage(res))
    );
  }

  deleteImage(imageId: number) {
    const url = `/api/images/${imageId}`;
    return this.http.delete(url);
  }

  likeImage(imageId: number) {
    const url = `/api/images/${imageId}/likes`;
    return this.http.post(url, {});
  }

  unlikeImage(imageId: number) {
    const url = `/api/images/${imageId}/likes`;
    return this.http.delete(url);
  }

  // Upload

  uploadImage(file: File) {
    const url = `/api/uploads`;
    const formData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post(url, formData);
  }
}
