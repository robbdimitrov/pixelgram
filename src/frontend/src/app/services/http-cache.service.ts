import {HttpEvent} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

@Injectable()
export class HttpCacheService {
  private cache = new Map<string, Observable<HttpEvent<any>>>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: Observable<HttpEvent<any>>) {
    this.cache.set(key, value);
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}
