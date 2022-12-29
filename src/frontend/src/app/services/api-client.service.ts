import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';

import {mapImage, mapUser} from '../shared/utils/mappers';
import {HttpCacheService} from './http-cache.service';

import {UserDto} from '../models/user.model';
import {ImageDto, ImageFilenameDto, ImagesDto} from '../models/image.model';

@Injectable()
export class APIClient {
  constructor(private http: HttpClient, private cache: HttpCacheService) {}

  // Users

  createUser(name: string, username: string, email: string, password: string) {
    const url = '/api/users';
    const body = {name, username, email, password};
    return this.http.post<UserDto>(url, body).pipe(map((res) => mapUser(res)));
  }

  getUser(userId: number, clearCache = false) {
    const url = `/api/users/${userId}`;
    if (clearCache) {
      this.cache.delete(url);
    }
    return this.http.get<UserDto>(url).pipe(map((res) => mapUser(res)));
  }

  updateUser(userId: number, name: string, username: string,
      email: string, avatar: string, bio: string) {
    const url = `/api/users/${userId}`;
    const body = {name, username, email, avatar, bio};
    return this.http.put<void>(url, body);
  }

  changePassword(userId: number, oldPassword: string, password: string) {
    const url = `/api/users/${userId}`;
    const body = {password, oldPassword};
    return this.http.put<void>(url, body);
  }

  // Sessions

  loginUser(email: string, password: string) {
    const url = '/api/sessions';
    const body = {email, password};
    return this.http.post<UserDto>(url, body).pipe(
      map((res) => mapUser(res))
    );
  }

  logoutUser() {
    const url = '/api/sessions';
    return this.http.delete(url);
  }

  // Images

  createImage(filename: string, description: string) {
    const url = '/api/images';
    const body = {filename, description};
    return this.http.post<ImageDto>(url, body).pipe(
      map((res) => mapImage(res))
    );
  }

  getFeed(page: number) {
    const url = `/api/images?page=${page}`;
    return this.http.get<ImagesDto>(url).pipe(
      map((res) => res.items.map((item) => mapImage(item)))
    );
  }

  getImages(userId: number, page: number) {
    const url = `/api/users/${userId}/images?page=${page}`;
    return this.http.get<ImagesDto>(url).pipe(
      map((res) => res.items.map((item) => mapImage(item)))
    );
  }

  getLikedImages(userId: number, page: number) {
    const url = `/api/users/${userId}/likes?page=${page}`;
    return this.http.get<ImagesDto>(url).pipe(
      map((res) => res.items.map((item) => mapImage(item)))
    );
  }

  getImage(imageId: number) {
    const url = `/api/images/${imageId}`;
    return this.http.get<ImageDto>(url).pipe(
      map((res) => mapImage(res))
    );
  }

  deleteImage(imageId: number) {
    const url = `/api/images/${imageId}`;
    return this.http.delete<void>(url);
  }

  likeImage(imageId: number) {
    const url = `/api/images/${imageId}/likes`;
    return this.http.post<void>(url, {});
  }

  unlikeImage(imageId: number) {
    const url = `/api/images/${imageId}/likes`;
    return this.http.delete<void>(url);
  }

  // Upload

  uploadImage(file: File) {
    const url = `/api/uploads`;
    const formData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post<ImageFilenameDto>(url, formData);
  }
}
