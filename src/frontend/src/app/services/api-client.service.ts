import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {map} from 'rxjs/operators';

import {mapImage, mapUser} from '../shared/utils/mappers';
import {HttpCacheService} from './http-cache.service';

import {User, UserDto, UserIdDto} from '../models/user.model';
import {Image, ImageDto, ImageFilenameDto, ImageIdDto, ImagesDto} from '../models/image.model';
import {Comment, CommentDto, CommentsDto} from '../models/comment.model';

@Injectable()
export class APIClient {
  constructor(private http: HttpClient, private cache: HttpCacheService) {}

  // Users

  createUser(name: string, username: string, email: string, password: string): Observable<UserIdDto> {
    const url = '/api/users';
    const body = {name, username, email, password};
    return this.http.post<UserIdDto>(url, body);
  }

  getUser(userId: number, clearCache = false): Observable<User> {
    const url = `/api/users/${userId}`;
    if (clearCache) {
      this.cache.delete(url);
    }
    return this.http.get<UserDto>(url).pipe(map((res) => mapUser(res)));
  }

  updateUser(userId: number, name: string, username: string,
      email: string, avatar: string, bio: string): Observable<void> {
    const url = `/api/users/${userId}`;
    const body = {name, username, email, avatar, bio};
    return this.http.put<void>(url, body);
  }

  changePassword(userId: number, oldPassword: string, password: string): Observable<void> {
    const url = `/api/users/${userId}`;
    const body = {password, oldPassword};
    return this.http.put<void>(url, body);
  }

  // Sessions

  loginUser(email: string, password: string): Observable<UserIdDto> {
    const url = '/api/sessions';
    const body = {email, password};
    return this.http.post<UserIdDto>(url, body);
  }

  logoutUser(): Observable<void> {
    const url = '/api/sessions';
    return this.http.delete<void>(url);
  }

  // Images

  createImage(filename: string, description: string): Observable<ImageIdDto> {
    const url = '/api/images';
    const body = {filename, description};
    return this.http.post<ImageIdDto>(url, body);
  }

  getFeed(page: number): Observable<Image[]> {
    const url = `/api/images?page=${page}`;
    return this.http.get<ImagesDto>(url).pipe(
      map((res) => res.items.map((item) => mapImage(item)))
    );
  }

  getImages(userId: number, page: number): Observable<Image[]> {
    const url = `/api/users/${userId}/images?page=${page}`;
    return this.http.get<ImagesDto>(url).pipe(
      map((res) => res.items.map((item) => mapImage(item)))
    );
  }

  getLikedImages(userId: number, page: number): Observable<Image[]> {
    const url = `/api/users/${userId}/likes?page=${page}`;
    return this.http.get<ImagesDto>(url).pipe(
      map((res) => res.items.map((item) => mapImage(item)))
    );
  }

  getImage(imageId: number): Observable<Image> {
    const url = `/api/images/${imageId}`;
    return this.http.get<ImageDto>(url).pipe(
      map((res) => mapImage(res))
    );
  }

  deleteImage(imageId: number): Observable<void> {
    const url = `/api/images/${imageId}`;
    return this.http.delete<void>(url);
  }

  likeImage(imageId: number): Observable<void> {
    const url = `/api/images/${imageId}/likes`;
    return this.http.post<void>(url, {});
  }

  unlikeImage(imageId: number): Observable<void> {
    const url = `/api/images/${imageId}/likes`;
    return this.http.delete<void>(url);
  }

  // Comments

  getComments(imageId: number, page: number): Observable<Comment[]> {
    const url = `/api/images/${imageId}/comments?page=${page}`;
    return this.http.get<CommentsDto>(url).pipe(
      map((res) => res.items.map((item) => new Comment(
        item.id, item.imageId, item.userId, item.username, item.avatar, item.body, new Date(item.created)
      )))
    );
  }

  createComment(imageId: number, body: string): Observable<Comment> {
    const url = `/api/images/${imageId}/comments`;
    return this.http.post<CommentDto>(url, {body}).pipe(
      map((res) => new Comment(
        res.id, res.imageId, res.userId, res.username, res.avatar, res.body, new Date(res.created)
      ))
    );
  }

  deleteComment(imageId: number, commentId: number): Observable<void> {
    const url = `/api/images/${imageId}/comments/${commentId}`;
    return this.http.delete<void>(url);
  }

  // Upload

  uploadImage(file: File): Observable<ImageFilenameDto> {
    const url = `/api/uploads`;
    const formData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post<ImageFilenameDto>(url, formData);
  }
}
