import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/finally';

import { Session } from './session.service';
import { Image } from '../models/image.model';
import { ImageFactory } from './image-factory.service';
import { User } from '../models/user.model';
import { UserFactory } from './user-factory.service';
import * as config from '../../../config/client.config';

enum StatusCode {
    Ok = 200,
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
    private apiRoot = config.apiRoot;
    private activeRequests = {};
    loginSubject = new Subject<string>();

    constructor(private http: HttpClient, private session: Session) {}

    // Internal

    headers(): HttpHeaders {
        let headers = new HttpHeaders({
            'content-type': 'application/json'
        });
        let token = this.session.token();
        if (token !== null) {
            headers = headers.set('authorization', token);
        }
        return headers;
    }

    // Use this method for all requests
    private request(method: HTTPMethod, urlPath: string, body?: Object,
        otherHeaders?: HttpHeaders): Observable<Object> {
        let key = `${method}:${urlPath}`;

        if (this.activeRequests[key]) {
            return this.activeRequests[key];
        }

        let headers = otherHeaders || this.headers();

        // Stringify only when using the default headers
        let options = {
            body: (otherHeaders ? body : JSON.stringify(body)), headers
        };

        let url = this.apiRoot + urlPath;

        let self = this;
        let observable = this.http.request(method, url, options)
            .finally(() => {
                delete self.activeRequests[key];
            }).share();

        this.activeRequests[key] = observable;

        return observable;
    }

    // User

    createUser(name: string, username: string, email: string, password: string) {
        let url = '/users';
        let body = {name, username, email, password};
        let request = this.request(HTTPMethod.Post, url, body);

        return new Promise((resolve, reject) => {
            request.toPromise().then(() => {
                resolve();
            }).catch((error) => {
                reject(error.error);
            });
        });
    }

    loginUser(email: string, password: string) {
        let url = '/sessions';
        let body = {email, password};
        let request = this.request(HTTPMethod.Post, url, body);

        return new Promise((resolve, reject) => {
            request.toPromise().then((response) => {
                this.session.setToken(response['token']);
                this.session.setUserId(response['user']['_id']);
                this.loginSubject.next(UserDidLoginNotification);
                resolve();
            }).catch((error) => {
                reject(error.error);
            });
        });
    }

    logoutUser() {
        this.session.reset();
        this.loginSubject.next(UserDidLogoutNotification);
    }

    getUser(userId: string): Promise<User> {
        let url = `/users/${userId}`;
        let request = this.request(HTTPMethod.Get, url);

        return new Promise((resolve, reject) => {
            request.toPromise().then((response) => {
                let responseUser = response['user'];
                let user = UserFactory.userFromObject(responseUser);
                resolve(user);
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    updateUser(userId: string, name: string, username: string, email: string, bio: string, avatar?: string) {
        let url = `/users/${userId}`;
        let body = {name, username, email, bio};

        if (avatar) {
            body['avatar'] = avatar;
        }

        let request = this.request(HTTPMethod.Put, url, body);

        return new Promise((resolve, reject) => {
            request.toPromise().then(() => {
                resolve();
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    changePassword(userId: string, oldPassword: string, password: string) {
        let url = `/users/${userId}`;

        let body = {password, oldPassword};
        let request = this.request(HTTPMethod.Put, url, body);

        return new Promise((resolve, reject) => {
            request.toPromise().then(() => {
                resolve();
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    // Image

    createImage(filename: string, description: string) {
        let url = '/images';
        let body = {filename, description};
        let request = this.request(HTTPMethod.Post, url, body);

        return new Promise((resolve, reject) => {
            request.toPromise().then(() => {
                resolve();
            }).catch((error) => {
                reject(error.error);
            });
        });
    }

    getImages(url: string): Promise<Image[]> {
        let request = this.request(HTTPMethod.Get, url);

        return new Promise((resolve, reject) => {
            request.toPromise().then((response) => {
                let images: Image[] = [];
                let responseImages = response['images'];
                for (let i = 0; i < responseImages.length; i++) {
                    let imageObject = responseImages[i];
                    let image = ImageFactory.imageFromObject(imageObject);
                    images.push(image);
                }
                resolve(images);
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    getUsersImages(userId: string, page: number, limit: number = 10) {
        let url = `/users/${userId}/images?page=${page}&limit=${limit}`;
        return this.getImages(url);
    }

    getAllImages(page: number, limit: number = 10) {
        let url = `/images?page=${page}&limit=${limit}`;
        return this.getImages(url);
    }

    getUsersLikedImages(userId: string, page: number, limit: number = 10) {
        let url = `/users/${userId}/likes?page=${page}&limit=${limit}`;
        return this.getImages(url);
    }

    getImage(imageId: string): Promise<Image> {
        let url = `/images/${imageId}`;
        let request = this.request(HTTPMethod.Get, url);

        return new Promise((resolve, reject) => {
            request.toPromise().then((response) => {
                let responseImage = response['image'];
                let image = ImageFactory.imageFromObject(responseImage);
                resolve(image);
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    updateImage(imageId: string, description: string) {
        let url = `/images/${imageId}`;
        let request = this.request(HTTPMethod.Put, url);

        return new Promise((resolve, reject) => {
            request.toPromise().then(() => {
                resolve();
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    deleteImage(imageId: string) {
        let url = `/images/${imageId}`;
        let request = this.request(HTTPMethod.Delete, url);

        return new Promise((resolve, reject) => {
            request.toPromise().then(() => {
                resolve();
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    uploadImage(file: File) {
        let url = `/upload`;
        let headers = new HttpHeaders();
        let token = this.session.token();
        if (token !== null) {
            headers = headers.set('authorization', token);
        }

        let formData = new FormData();
        formData.append('image', file, file.name);

        let request = this.request(HTTPMethod.Post, url, formData, headers);

        return new Promise((resolve, reject) => {
            request.toPromise().then((response) => {
                resolve(response);
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    likeImage(imageId: string) {
        let url = `/images/${imageId}/likes`;
        let request = this.request(HTTPMethod.Post, url);

        return new Promise((resolve, reject) => {
            request.toPromise().then(() => {
                resolve();
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }

    unlikeImage(userId: string, imageId: string) {
        let url = `/images/${imageId}/likes/${userId}`;
        let request = this.request(HTTPMethod.Delete, url);

        return new Promise((resolve, reject) => {
            request.toPromise().then(() => {
                resolve();
            }).catch((error) => {
                if (error.status === StatusCode.Unauthorized) {
                    this.logoutUser();
                }
                reject(error.error);
            });
        });
    }
}
