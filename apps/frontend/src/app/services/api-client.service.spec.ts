import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APIClient } from './api-client.service';

describe('APIClient', () => {
  let service: APIClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        APIClient
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
        posts: 0,
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
        posts: 0,
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

  describe('createPost', () => {
    it('should POST post data', () => {
      const mockPostRes = {
        id: 1
      };

      service.createPost('img.jpg', 'Testing').subscribe(res => {
        expect(res.id).toBe(1);
      });

      const req = httpMock.expectOne('/api/posts');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ filename: 'img.jpg', description: 'Testing' });
      req.flush(mockPostRes);
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

  describe('createUser', () => {
    it('should POST and return created user id', () => {
      service.createUser('Test', 'test', 't@t.com', 'pass').subscribe(user => {
        expect(user.id).toBe(1);
      });
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 1 });
    });
  });

  describe('updateUser', () => {
    it('should PUT user', () => {
      service.updateUser(1, 'Test', 't', 't@t.com', 'a', 'b').subscribe();
      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('changePassword', () => {
    it('should PUT password', () => {
      service.changePassword(1, 'old', 'new').subscribe();
      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('logoutUser', () => {
    it('should DELETE session', () => {
      service.logoutUser().subscribe();
      const req = httpMock.expectOne('/api/sessions');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('getFeed', () => {
    it('should GET feed', () => {
      service.getFeed(null).subscribe();
      const req = httpMock.expectOne('/api/posts');
      expect(req.request.method).toBe('GET');
      req.flush({items: [], nextCursor: null});
    });
  });

  describe('getPosts', () => {
    it('should GET user posts', () => {
      service.getPosts(1, 'next cursor').subscribe();
      const req = httpMock.expectOne('/api/users/1/posts?cursor=next%20cursor');
      expect(req.request.method).toBe('GET');
      req.flush({items: [], nextCursor: null});
    });
  });

  describe('getLikedPosts', () => {
    it('should GET liked posts', () => {
      service.getLikedPosts(1, null).subscribe();
      const req = httpMock.expectOne('/api/users/1/likes');
      expect(req.request.method).toBe('GET');
      req.flush({items: [], nextCursor: null});
    });
  });

  describe('getComments', () => {
    it('should GET post comments', () => {
      service.getComments(42, 'next').subscribe();
      const req = httpMock.expectOne('/api/posts/42/comments?cursor=next');
      expect(req.request.method).toBe('GET');
      req.flush({items: [], nextCursor: null});
    });
  });

  describe('getPost', () => {
    it('should GET post', () => {
      service.getPost(1).subscribe();
      const req = httpMock.expectOne('/api/posts/1');
      expect(req.request.method).toBe('GET');
      req.flush({ id: '1' });
    });
  });

  describe('deletePost', () => {
    it('should DELETE post', () => {
      service.deletePost(1).subscribe();
      const req = httpMock.expectOne('/api/posts/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('likePost', () => {
    it('should POST like', () => {
      service.likePost(1).subscribe();
      const req = httpMock.expectOne('/api/posts/1/likes');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('unlikePost', () => {
    it('should DELETE like', () => {
      service.unlikePost(1).subscribe();
      const req = httpMock.expectOne('/api/posts/1/likes');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });
});
