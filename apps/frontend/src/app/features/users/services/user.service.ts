import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {User, UserDto} from '../models/user.model';
import {CursorPage} from '../../../shared/models/pagination.model';
import {mapUser} from '../../../shared/utils/mappers';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  getUserByUsername(username: string): Observable<User> {
    const url = `/api/users/${encodeURIComponent(username)}`;
    return this.http.get<UserDto>(url).pipe(map((res) => mapUser(res)));
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<UserDto>('/api/users/me').pipe(map((res) => mapUser(res)));
  }

  getFollowers(username: string, cursor: string | null): Observable<CursorPage<User>> {
    return this.getUserPage(`/api/users/${encodeURIComponent(username)}/followers`, cursor);
  }

  getFollowing(username: string, cursor: string | null): Observable<CursorPage<User>> {
    return this.getUserPage(`/api/users/${encodeURIComponent(username)}/following`, cursor);
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

  private getUserPage(url: string, cursor: string | null): Observable<CursorPage<User>> {
    return this.http.get<CursorPage<UserDto>>(url, {params: this.cursorParams(cursor)}).pipe(
      map((res) => ({
        items: res.items.map((item) => mapUser(item)),
        nextCursor: res.nextCursor
      }))
    );
  }

  private cursorParams(cursor: string | null): HttpParams {
    return cursor ? new HttpParams().set('cursor', cursor) : new HttpParams();
  }
}
