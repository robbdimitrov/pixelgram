import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {mapPost, mapUser} from '../shared/utils/mappers';

import {User, UserDto, UserIdDto} from '../models/user.model';
import {Post, PostDto, ImageFilenameDto, PostIdDto} from '../models/post.model';
import {Comment, CommentDto} from '../models/comment.model';
import {CursorPage} from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class APIClient {
  private http = inject(HttpClient);

  // Users

  createUser(name: string, username: string, email: string, password: string): Observable<UserIdDto> {
    const url = '/api/users';
    const body = {name, username: username.trim().toLowerCase(), email, password};
    return this.http.post<UserIdDto>(url, body);
  }

  getUserByUsername(username: string): Observable<User> {
    const url = `/api/users/${encodeURIComponent(username)}`;
    return this.http.get<UserDto>(url).pipe(map((res) => mapUser(res)));
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<UserDto>('/api/users/me').pipe(map((res) => mapUser(res)));
  }

  updateUser(userId: number, name: string, username: string,
      email: string, avatar: string, bio: string): Observable<void> {
    const url = `/api/users/${userId}`;
    const body = {name, username: username.trim().toLowerCase(), email, avatar, bio};
    return this.http.put<void>(url, body);
  }

  changePassword(userId: number, oldPassword: string, password: string): Observable<void> {
    const url = `/api/users/${userId}`;
    const body = {password, oldPassword};
    return this.http.put<void>(url, body);
  }

  followUser(userId: number): Observable<void> {
    const url = `/api/users/${userId}/follow`;
    return this.http.post<void>(url, {});
  }

  unfollowUser(userId: number): Observable<void> {
    const url = `/api/users/${userId}/follow`;
    return this.http.delete<void>(url);
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

  // Posts

  createPost(filename: string, description: string): Observable<PostIdDto> {
    const url = '/api/posts';
    const body = {filename, description};
    return this.http.post<PostIdDto>(url, body);
  }

  getFeed(cursor: string | null): Observable<CursorPage<Post>> {
    return this.getPostPage('/api/posts', cursor);
  }

  getPosts(username: string, cursor: string | null): Observable<CursorPage<Post>> {
    return this.getPostPage(`/api/users/${encodeURIComponent(username)}/posts`, cursor);
  }

  getLikedPosts(username: string, cursor: string | null): Observable<CursorPage<Post>> {
    return this.getPostPage(`/api/users/${encodeURIComponent(username)}/likes`, cursor);
  }

  private getPostPage(url: string, cursor: string | null): Observable<CursorPage<Post>> {
    return this.http.get<CursorPage<PostDto>>(url, {params: this.cursorParams(cursor)}).pipe(
      map((res) => ({
        items: res.items.map((item) => mapPost(item)),
        nextCursor: res.nextCursor
      }))
    );
  }

  getPost(publicId: string): Observable<Post> {
    const url = `/api/posts/${publicId}`;
    return this.http.get<PostDto>(url).pipe(
      map((res) => mapPost(res))
    );
  }

  deletePost(publicId: string): Observable<void> {
    const url = `/api/posts/${publicId}`;
    return this.http.delete<void>(url);
  }

  likePost(publicId: string): Observable<void> {
    const url = `/api/posts/${publicId}/likes`;
    return this.http.post<void>(url, {});
  }

  unlikePost(publicId: string): Observable<void> {
    const url = `/api/posts/${publicId}/likes`;
    return this.http.delete<void>(url);
  }

  // Comments

  getComments(publicId: string, cursor: string | null): Observable<CursorPage<Comment>> {
    const url = `/api/posts/${publicId}/comments`;
    return this.http.get<CursorPage<CommentDto>>(url, {params: this.cursorParams(cursor)}).pipe(
      map((res) => ({
        items: res.items.map((item) => new Comment(
          item.id, item.postId, item.userId, item.username, item.avatar, item.body, new Date(item.created)
        )),
        nextCursor: res.nextCursor
      }))
    );
  }

  createComment(publicId: string, body: string): Observable<Comment> {
    const url = `/api/posts/${publicId}/comments`;
    return this.http.post<CommentDto>(url, {body}).pipe(
      map((res) => new Comment(
        res.id, res.postId, res.userId, res.username, res.avatar, res.body, new Date(res.created)
      ))
    );
  }

  deleteComment(publicId: string, commentId: number): Observable<void> {
    const url = `/api/posts/${publicId}/comments/${commentId}`;
    return this.http.delete<void>(url);
  }

  // Upload

  uploadImage(file: File): Observable<ImageFilenameDto> {
    const url = `/api/uploads`;
    const formData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post<ImageFilenameDto>(url, formData);
  }

  private cursorParams(cursor: string | null): HttpParams {
    return cursor ? new HttpParams().set('cursor', cursor) : new HttpParams();
  }
}
