import { TestBed } from '@angular/core/testing';
import { HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { HttpCacheService } from './http-cache.service';

describe('HttpCacheService', () => {
  let service: HttpCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpCacheService]
    });
    service = TestBed.inject(HttpCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve an item', () => {
    const mockObservable = of({} as HttpEvent<any>);
    service.set('test-key', mockObservable);
    expect(service.get('test-key')).toBe(mockObservable);
  });

  it('should return undefined for a non-existent key', () => {
    expect(service.get('non-existent-key')).toBeUndefined();
  });

  it('should delete an item', () => {
    const mockObservable = of({} as HttpEvent<any>);
    service.set('test-key', mockObservable);
    service.delete('test-key');
    expect(service.get('test-key')).toBeUndefined();
  });

  it('should clear all items', () => {
    const mockObservable = of({} as HttpEvent<any>);
    service.set('test-key-1', mockObservable);
    service.set('test-key-2', mockObservable);
    service.clear();
    expect(service.get('test-key-1')).toBeUndefined();
    expect(service.get('test-key-2')).toBeUndefined();
  });
});
