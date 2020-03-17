import { Injectable } from '@angular/core';
import {
  HttpClient, HttpHeaders, HttpErrorResponse
} from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { catchError, map, share, finalize } from 'rxjs/operators';

import { Session } from './session.service';
import { mapImage, mapUser } from '../shared/utils/mappers';
import { environment } from '../../environments/environment';

export const UserDidLogoutNotification = 'UserDidLogoutNotification';
export const UserDidLoginNotification = 'UserDidLoginNotification';

@Injectable()
export class APIClient {
  private apiRoot = environment.apiRoot;
  loginSubject = new Subject<string>();
  private activeRequests = {};

  constructor(private http: HttpClient, private session: Session) {}

  // Private

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'content-type': 'application/json'
    });
  }

  private url(urlPath: string) {
    return this.apiRoot + urlPath;
  }

  private handleError(error: HttpErrorResponse) {
    let errorBody = error.error || error;

    if (errorBody instanceof ErrorEvent) {
      console.error(`An error occurred: ${errorBody.message}`);
    } else {
      errorBody = errorBody.error || errorBody;

      console.error(`An error occurred: ${error.message}: ` +
        errorBody.message);

      if (error.status === 401) { // Unauthorized
        this.logoutUser();
      }
    }
    return throwError(errorBody);
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
      map((res: any) => {
        this.session.setUserId(res.data.user._id);
        this.loginSubject.next(UserDidLoginNotification);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  logoutUser() {
    const url = this.url('/sessions');

    return this.http.delete(url).pipe(
      map((res: any) => {
        this.session.reset();
        this.loginSubject.next(UserDidLogoutNotification);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  getUser(userId: string) {
    const url = this.url(`/users/${userId}`);

    if (this.activeRequests[url]) {
      return this.activeRequests[url];
    }

    const headers = this.headers();

    const req = this.http.get(url, { headers }).pipe(
      map((res: any) => mapUser(res.data)),
      catchError(this.handleError.bind(this)),
      finalize(() => delete this.activeRequests[url]),
      share()
    );
    this.activeRequests[url] = req;
    return req;
  }

  updateUser(userId: string, name: string, username: string,
             email: string, bio: string, avatar?: string) {
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

    if (this.activeRequests[url]) {
      return this.activeRequests[url];
    }

    const req = this.http.get(url, { headers }).pipe(
      map((res: any) =>
        res.data.map((object) => mapImage(object))),
      catchError(this.handleError.bind(this)),
      finalize(() => delete this.activeRequests[url]),
      share()
    );
    this.activeRequests[url] = req;
    return req;
  }

  getAllImages(page: number) {
    const url = this.url(`/images?page=${page}`);
    return this.getImages(url);
  }

  getImagesByUser(userId: string, page: number) {
    const url = this.url(`/users/${userId}/images?page=${page}`);
    return this.getImages(url);
  }

  getImagesLikedByUser(userId: string, page: number) {
    const url = this.url(`/users/${userId}/likes?page=${page}`);
    return this.getImages(url);
  }

  getImage(imageId: string) {
    const url = this.url(`/images/${imageId}`);

    if (this.activeRequests[url]) {
      return this.activeRequests[url];
    }

    const headers = this.headers();

    const req = this.http.get(url, { headers }).pipe(
      map((res: any) => mapImage(res.data)),
      catchError(this.handleError.bind(this)),
      finalize(() => delete this.activeRequests[url]),
      share()
    );
    this.activeRequests[url] = req;
    return req;
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

    const formData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post(url, formData).pipe(
      map((res: any) => res.data),
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
