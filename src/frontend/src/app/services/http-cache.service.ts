import { HttpEvent, HttpResponse } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpCacheService {
  private cache = new Map<string, Observable<HttpEvent<unknown>> | HttpResponse<unknown>>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: Observable<HttpEvent<unknown>> | HttpResponse<unknown>) {
    this.cache.set(key, value);
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}
