import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {mapPost, mapUser} from '../shared/utils/mappers';

import {User, UserDto, UserIdDto} from '../models/user.model';
import {Post, PostDto, ImageFilenameDto, PostIdDto, PostsDto} from '../models/post.model';
import {Comment, CommentDto, CommentsDto} from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class APIClient {
  private http = inject(HttpClient);

  // Users

  createUser(name: string, username: string, email: string, password: string): Observable<UserIdDto> {
    const url = '/api/users';
    const body = {name, username, email, password};
    return this.http.post<UserIdDto>(url, body);
  }

  getUser(userId: number): Observable<User> {
    const url = `/api/users/${userId}`;
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

  // Posts

  createPost(filename: string, description: string): Observable<PostIdDto> {
    const url = '/api/posts';
    const body = {filename, description};
    return this.http.post<PostIdDto>(url, body);
  }

  getFeed(page: number): Observable<Post[]> {
    const url = `/api/posts?page=${page}`;
    return this.http.get<PostsDto>(url).pipe(
      map((res) => res.items.map((item) => mapPost(item)))
    );
  }

  getPosts(userId: number, page: number): Observable<Post[]> {
    const url = `/api/users/${userId}/posts?page=${page}`;
    return this.http.get<PostsDto>(url).pipe(
      map((res) => res.items.map((item) => mapPost(item)))
    );
  }

  getLikedPosts(userId: number, page: number): Observable<Post[]> {
    const url = `/api/users/${userId}/likes?page=${page}`;
    return this.http.get<PostsDto>(url).pipe(
      map((res) => res.items.map((item) => mapPost(item)))
    );
  }

  getPost(postId: number): Observable<Post> {
    const url = `/api/posts/${postId}`;
    return this.http.get<PostDto>(url).pipe(
      map((res) => mapPost(res))
    );
  }

  deletePost(postId: number): Observable<void> {
    const url = `/api/posts/${postId}`;
    return this.http.delete<void>(url);
  }

  likePost(postId: number): Observable<void> {
    const url = `/api/posts/${postId}/likes`;
    return this.http.post<void>(url, {});
  }

  unlikePost(postId: number): Observable<void> {
    const url = `/api/posts/${postId}/likes`;
    return this.http.delete<void>(url);
  }

  // Comments

  getComments(postId: number, page: number): Observable<Comment[]> {
    const url = `/api/posts/${postId}/comments?page=${page}`;
    return this.http.get<CommentsDto>(url).pipe(
      map((res) => res.items.map((item) => new Comment(
        item.id, item.postId, item.userId, item.username, item.avatar, item.body, new Date(item.created)
      )))
    );
  }

  createComment(postId: number, body: string): Observable<Comment> {
    const url = `/api/posts/${postId}/comments`;
    return this.http.post<CommentDto>(url, {body}).pipe(
      map((res) => new Comment(
        res.id, res.postId, res.userId, res.username, res.avatar, res.body, new Date(res.created)
      ))
    );
  }

  deleteComment(postId: number, commentId: number): Observable<void> {
    const url = `/api/posts/${postId}/comments/${commentId}`;
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
