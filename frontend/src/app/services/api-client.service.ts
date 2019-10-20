import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Subject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Session } from './session.service';
import { Image } from '../models/image.model';
import { ImageFactory } from './image-factory.service';
import { User } from '../models/user.model';
import { UserFactory } from './user-factory.service';
import { environment } from '../../environments/environment';

enum StatusCode {
  Ok = 200,
  Created =  201,
  NoContent = 204,
  NotModified = 304,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404
}

enum HTTPMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE'
}

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

  // Use this method for all requests
  private request(method: HTTPMethod, urlPath: string, body?: any,
                  otherHeaders?: HttpHeaders): Observable<any> {
    const headers = otherHeaders || this.headers();

    const options = { body, headers };
    const url = this.apiRoot + urlPath;
    const observable = this.http.request(method, url, options).pipe(
      catchError(this.handleError)
    );
    return observable;
  }

  private handleError(error: HttpErrorResponse) {
    console.log(`handle error ${JSON.stringify(error)}`);
    if (error.error instanceof ErrorEvent) {
      console.error(`An error occurred: ${error.error.message}`);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`
      );
    }
    return throwError(error.message);
  }

  // User

  createUser(name: string, username: string, email: string, password: string) {
    const url = '/users';
    const body = { name, username, email, password };
    const request = this.request(HTTPMethod.Post, url, body);

    return new Promise((resolve, reject) => {
      request.subscribe(
        () => resolve(),
        (error) => reject(error.error)
      );
    });
  }

  loginUser(email: string, password: string) {
    const url = '/sessions';
    const body = { email, password };
    const request = this.request(HTTPMethod.Post, url, body);

    return new Promise((resolve, reject) => {
      request.subscribe(
        (data) => {
          this.session.setToken(data.token);
          this.session.setUserId(data.user._id);
          this.loginSubject.next(UserDidLoginNotification);
          resolve();
        },
        (error) => reject(error.error)
      );
    });
  }

  logoutUser() {
    this.session.reset();
    this.loginSubject.next(UserDidLogoutNotification);
  }

  getUser(userId: string): Promise<User> {
    const url = `/users/${userId}`;
    const request = this.request(HTTPMethod.Get, url);

    return new Promise((resolve, reject) => {
      request.subscribe(
        (data) => {
          const user = UserFactory.userFromObject(data.user);
          resolve(user);
        },
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }

  updateUser(userId: string, name: string, username: string, email: string, bio: string, avatar?: string) {
    const url = `/users/${userId}`;
    const body: any = { name, username, email, bio };

    if (avatar) {
      body.avatar = avatar;
    }

    const request = this.request(HTTPMethod.Put, url, body);

    return new Promise((resolve, reject) => {
      request.subscribe(
        () => resolve(),
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }

  changePassword(userId: string, oldPassword: string, password: string) {
    const url = `/users/${userId}`;

    const body = { password, oldPassword };
    const request = this.request(HTTPMethod.Put, url, body);

    return new Promise((resolve, reject) => {
      request.subscribe(
        () => resolve(),
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }

  // Image

  createImage(filename: string, description: string) {
    const url = '/images';
    const body = { filename, description };
    const request = this.request(HTTPMethod.Post, url, body);

    return new Promise((resolve, reject) => {
      request.subscribe(
        () => resolve(),
        (error) => reject(error.error)
      );
    });
  }

  getImages(url: string): Promise<Image[]> {
    const request = this.request(HTTPMethod.Get, url);

    return new Promise((resolve, reject) => {
      request.subscribe(
        (data) => {
          const images = data.images.map(
            (object) => ImageFactory.imageFromObject(object)
          );
          resolve(images);
        },
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }

  getUsersImages(userId: string, page: number, limit: number = 10) {
    const url = `/users/${userId}/images?page=${page}&limit=${limit}`;
    return this.getImages(url);
  }

  getAllImages(page: number, limit: number = 10) {
    const url = `/images?page=${page}&limit=${limit}`;
    return this.getImages(url);
  }

  getUsersLikedImages(userId: string, page: number, limit: number = 10) {
    const url = `/users/${userId}/likes?page=${page}&limit=${limit}`;
    return this.getImages(url);
  }

  getImage(imageId: string): Promise<Image> {
    const url = `/images/${imageId}`;
    const request = this.request(HTTPMethod.Get, url);

    return new Promise((resolve, reject) => {
      request.subscribe(
        (data) => {
          const image = ImageFactory.imageFromObject(data.image);
          resolve(image);
        },
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }

  deleteImage(imageId: string) {
    const url = `/images/${imageId}`;
    const request = this.request(HTTPMethod.Delete, url);

    return new Promise((resolve, reject) => {
      request.subscribe(
        () => resolve(),
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }

  uploadImage(file: File) {
    const url = `/upload`;
    const headers = this.headers().delete('Content-Type');

    const formData = new FormData();
    formData.append('image', file, file.name);

    const request = this.request(HTTPMethod.Post, url, formData, headers);

    return new Promise((resolve, reject) => {
      request.subscribe(
        (data) => resolve(data),
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }

  likeImage(imageId: string) {
    const url = `/images/${imageId}/likes`;
    const request = this.request(HTTPMethod.Post, url);

    return new Promise((resolve, reject) => {
      request.subscribe(
        () => resolve(),
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }

  unlikeImage(userId: string, imageId: string) {
    const url = `/images/${imageId}/likes/${userId}`;
    const request = this.request(HTTPMethod.Delete, url);

    return new Promise((resolve, reject) => {
      request.subscribe(
        () => resolve(),
        (error) => {
          if (error.status === StatusCode.Unauthorized) {
            this.logoutUser();
          }
          reject(error.error);
        }
      );
    });
  }
}
