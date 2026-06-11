import {TestBed} from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {HttpClient, provideHttpClient, withInterceptors} from '@angular/common/http';
import {PLATFORM_ID, REQUEST} from '@angular/core';

import {serverApiInterceptor} from './server-api-interceptor';
import {BACKEND_URL} from '../../shared/tokens';

function makeRequest(cookieHeader: string): Request {
  return {headers: {get: (name: string) => name.toLowerCase() === 'cookie' ? cookieHeader : null}} as unknown as Request;
}

describe('serverApiInterceptor — server platform', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([serverApiInterceptor])),
        provideHttpClientTesting(),
        {provide: PLATFORM_ID, useValue: 'server'},
        {provide: BACKEND_URL, useValue: 'http://backend:8080'},
        {provide: REQUEST, useValue: makeRequest('session=abc123; theme=dark')}
      ]
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should rewrite /api/posts to http://backend:8080/posts with Cookie header', () => {
    client.get('/api/posts').subscribe();

    const req = http.expectOne('http://backend:8080/posts');
    expect(req.request.headers.get('Cookie')).toBe('session=abc123; theme=dark');
    req.flush([]);
  });

  it('should rewrite /api/users/1 to http://backend:8080/users/1', () => {
    client.get('/api/users/1').subscribe();

    const req = http.expectOne('http://backend:8080/users/1');
    expect(req.request.headers.get('Cookie')).toBeDefined();
    req.flush({});
  });

  it('should not rewrite non-/api URLs', () => {
    client.get('/assets/logo.png').subscribe();

    http.expectOne('/assets/logo.png').flush('');
  });
});

describe('serverApiInterceptor — browser platform', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([serverApiInterceptor])),
        provideHttpClientTesting(),
        {provide: PLATFORM_ID, useValue: 'browser'},
        {provide: BACKEND_URL, useValue: 'http://backend:8080'}
      ]
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should pass /api/posts through unchanged on the browser', () => {
    client.get('/api/posts').subscribe();

    http.expectOne('/api/posts').flush([]);
  });
});
