import { Injectable } from '@angular/core';
import {
  HttpClient, HttpHeaders, HttpErrorResponse
} from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Session } from './session.service';
import { ImageFactory } from './image-factory.service';
import { UserFactory } from './user-factory.service';
import { environment } from '../../environments/environment';

export const UserDidLogoutNotification = 'UserDidLogoutNotification';
export const UserDidLoginNotification = 'UserDidLoginNotification';

@Injectable()
export class APIClient {
  private apiRoot = environment.apiRoot;
  loginSubject = new Subject<string>();

  constructor(private http: HttpClient, private session: Session) {}

  // Internal

  private headers(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const token = this.session.token();
    if (token !== null) {
      headers = headers.set('Authorization', token);
    }
    return headers;
  }

  private url(urlPath: string) {
    return this.apiRoot + urlPath;
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.error.message || error.message;
    if (error.error instanceof ErrorEvent) {
      console.error(`An error occurred: ${error.error.message}`);
    } else {
      if (error.status === 401) { // Unauthorized
        this.logoutUser();
      }
    }
    return throwError(message);
  }

  // User

  createUser(name: string, username: string, email: string, password: string) {
    const url = this.url('/users');
    const body = { name, username, email, password };
    const headers = this.headers();

    return this.http.post(url, body, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  loginUser(email: string, password: string) {
    const url = this.url('/sessions');
    const body = { email, password };
    const headers = this.headers();

    return this.http.post(url, body, { headers }).pipe(
      map((data: any) => {
        this.session.setToken(data.token);
        this.session.setUserId(data.user._id);
        this.loginSubject.next(UserDidLoginNotification);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  logoutUser() {
    this.session.reset();
    this.loginSubject.next(UserDidLogoutNotification);
  }

  getUser(userId: string) {
    const url = this.url(`/users/${userId}`);
    const headers = this.headers();

    return this.http.get(url, { headers }).pipe(
      map((data: any) => UserFactory.userFromObject(data.user)),
      catchError(this.handleError.bind(this))
    );
  }

  updateUser(userId: string, name: string, username: string, email: string, bio: string, avatar?: string) {
    const url = this.url(`/users/${userId}`);
    const body: any = { name, username, email, bio };
    const headers = this.headers();

    if (avatar) {
      body.avatar = avatar;
    }

    return this.http.put(url, body, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  changePassword(userId: string, oldPassword: string, password: string) {
    const url = this.url(`/users/${userId}`);
    const body = { password, oldPassword };
    const headers = this.headers();

    return this.http.put(url, body, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Image

  createImage(filename: string, description: string) {
    const url = this.url('/images');
    const body = { filename, description };
    const headers = this.headers();

    return this.http.post(url, body, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getImages(url: string) {
    const headers = this.headers();

    return this.http.get(url, { headers }).pipe(
      map((data: any) => {
        const images = data.images.map(
          (object) => ImageFactory.imageFromObject(object)
        );
        return images;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getUsersImages(userId: string, page: number, limit: number = 10) {
    const url = this.url(`/users/${userId}/images?page=${page}&limit=${limit}`);
    return this.getImages(url);
  }

  getAllImages(page: number, limit: number = 10) {
    const url = this.url(`/images?page=${page}&limit=${limit}`);
    return this.getImages(url);
  }

  getUsersLikedImages(userId: string, page: number, limit: number = 10) {
    const url = this.url(`/users/${userId}/likes?page=${page}&limit=${limit}`);
    return this.getImages(url);
  }

  getImage(imageId: string) {
    const url = this.url(`/images/${imageId}`);
    const headers = this.headers();

    return this.http.get(url, { headers }).pipe(
      map((data: any) => ImageFactory.imageFromObject(data.image)),
      catchError(this.handleError.bind(this))
    );
  }

  deleteImage(imageId: string) {
    const url = this.url(`/images/${imageId}`);
    const headers = this.headers();

    return this.http.delete(url, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  uploadImage(file: File) {
    const url = this.url(`/upload`);
    const headers = this.headers().delete('Content-Type');

    const formData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post(url, formData, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  likeImage(imageId: string) {
    const url = this.url(`/images/${imageId}/likes`);
    const headers = this.headers();

    return this.http.post(url, undefined, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  unlikeImage(userId: string, imageId: string) {
    const url = this.url(`/images/${imageId}/likes/${userId}`);
    const headers = this.headers();

    return this.http.delete(url, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}
