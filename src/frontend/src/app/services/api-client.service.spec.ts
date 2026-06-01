import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APIClient } from './api-client.service';
import { HttpCacheService } from './http-cache.service';

describe('APIClient', () => {
  let service: APIClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        APIClient,
        {
          provide: HttpCacheService,
          useValue: { delete: jest.fn() } // Mock the cache service
        }
      ]
    });

    service = TestBed.inject(APIClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUser', () => {
    it('should fetch a user and map it', () => {
      const mockUserRes = {
        id: 1,
        name: 'Test',
        username: 'testuser',
        email: 'test@test.com',
        created: '1',
        images: 0,
        likes: 0
      };

      service.getUser(1).subscribe(user => {
        expect(user.id).toBe(1);
        expect(user.name).toBe('Test');
      });

      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockUserRes);
    });
  });

  describe('loginUser', () => {
    it('should login and return user details', () => {
      const mockLoginRes = {
        id: 1,
        name: 'Test',
        username: 'testuser',
        email: 'test@test.com',
        created: '1',
        images: 0,
        likes: 0
      };

      service.loginUser('test@test.com', 'password').subscribe(res => {
        expect(res.id).toBe(1);
      });

      const req = httpMock.expectOne('/api/sessions');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.com', password: 'password' });
      req.flush(mockLoginRes);
    });
  });

  describe('createImage', () => {
    it('should POST image data', () => {
      const mockImageRes = {
        id: '1',
        filename: 'img.jpg',
        description: 'Testing',
        likes: 0,
        liked: false,
        user_id: '1'
      };

      service.createImage('img.jpg', 'Testing').subscribe(res => {
        expect(res.id).toBe(1);
        expect(res.filename).toBe('img.jpg');
      });

      const req = httpMock.expectOne('/api/images');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ filename: 'img.jpg', description: 'Testing' });
      req.flush(mockImageRes);
    });
  });

  describe('uploadImage', () => {
    it('should POST a FormData with the image', () => {
      // We can't easily assert FormData contents perfectly in jsdom/jasmine without extra steps, 
      // but we can check if it's FormData.
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      service.uploadImage(mockFile).subscribe(res => {
        expect(res.filename).toBe('test.jpg');
      });

      const req = httpMock.expectOne('/api/uploads');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ filename: 'test.jpg' });
    });
  });
});
