import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {UserIdDto} from '../../users/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  createUser(name: string, username: string, email: string, password: string): Observable<UserIdDto> {
    const url = '/api/users';
    const body = {name, username: username.trim().toLowerCase(), email, password};
    return this.http.post<UserIdDto>(url, body);
  }

  loginUser(email: string, password: string): Observable<UserIdDto> {
    const url = '/api/sessions';
    const body = {email, password};
    return this.http.post<UserIdDto>(url, body);
  }

  logoutUser(): Observable<void> {
    const url = '/api/sessions';
    return this.http.delete<void>(url);
  }
}
