import request from 'supertest';
import createApp from '../src/index';

// Create a mock DB Client
const mockDbClient = {
  getSession: jest.fn(),
  refreshSession: jest.fn(),
  getFeed: jest.fn(),
  likeImage: jest.fn(),
  imageExists: jest.fn()
} as any;

const app = createApp(mockDbClient, '/tmp');

describe('Image Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock valid session for auth guard
    mockDbClient.getSession.mockResolvedValue({ id: 'fake-session', userId: '1' });
    mockDbClient.refreshSession.mockResolvedValue({ id: 'fake-session', userId: '1' });
  });

  describe('GET /images (Feed)', () => {
    it('should return a list of images', async () => {
      const mockFeed = [
        { id: '101', filename: 'img1.jpg', description: 'Test Image', likes: 5, liked: false, user_id: '2' }
      ];
      mockDbClient.getFeed.mockResolvedValue(mockFeed);

      const res = await request(app)
        .get('/images')
        .set('Cookie', ['session=fake-session']);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ items: mockFeed });
      expect(mockDbClient.getFeed).toHaveBeenCalled();
    });

    it('should return 401 if unauthorized', async () => {
      mockDbClient.getSession.mockResolvedValue(undefined);

      const res = await request(app).get('/images');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('POST /images/:imageId/likes (Like Image)', () => {
    it('should like an image and return 204', async () => {
      mockDbClient.imageExists.mockResolvedValue(true);
      mockDbClient.likeImage.mockResolvedValue(1); // 1 row inserted

      const res = await request(app)
        .post('/images/101/likes')
        .set('Cookie', ['session=fake-session']);

      expect(res.statusCode).toEqual(204);
      expect(mockDbClient.likeImage).toHaveBeenCalledWith('101', '1');
    });
  });

  describe('POST /images', () => {
    it('should create an image and return 201', async () => {
      mockDbClient.createImage = jest.fn().mockResolvedValue({ id: '102', filename: 'img.jpg', description: 'desc', likes: 0, liked: false, user_id: '1' });
      const res = await request(app).post('/images').set('Cookie', ['session=fake-session']).send({ filename: 'img.jpg', description: 'desc' });
      expect(res.statusCode).toEqual(201);
      expect(mockDbClient.createImage).toHaveBeenCalledWith('1', 'img.jpg', 'desc');
    });

    it('should return 400 if filename is missing', async () => {
      const res = await request(app).post('/images').set('Cookie', ['session=fake-session']).send({ description: 'desc' });
      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 if upload not found', async () => {
      mockDbClient.createImage = jest.fn().mockResolvedValue(null);
      const res = await request(app).post('/images').set('Cookie', ['session=fake-session']).send({ filename: 'bad.jpg' });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /users/:userId/images', () => {
    it('should return user images', async () => {
      mockDbClient.getImages = jest.fn().mockResolvedValue([{ id: '101' }]);
      const res = await request(app).get('/users/1/images').set('Cookie', ['session=fake-session']);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ items: [{ id: '101' }] });
    });
  });

  describe('GET /users/:userId/likes', () => {
    it('should return liked images', async () => {
      mockDbClient.getLikedImages = jest.fn().mockResolvedValue([{ id: '102' }]);
      const res = await request(app).get('/users/1/likes').set('Cookie', ['session=fake-session']);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ items: [{ id: '102' }] });
    });
  });

  describe('GET /images/:imageId', () => {
    it('should return an image', async () => {
      mockDbClient.getImage = jest.fn().mockResolvedValue({ id: '101' });
      const res = await request(app).get('/images/101').set('Cookie', ['session=fake-session']);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ id: '101' });
    });

    it('should return 404 if not found', async () => {
      mockDbClient.getImage = jest.fn().mockResolvedValue(null);
      const res = await request(app).get('/images/999').set('Cookie', ['session=fake-session']);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('DELETE /images/:imageId', () => {
    it('should delete image and return 204', async () => {
      mockDbClient.deleteImage = jest.fn().mockResolvedValue(1);
      const res = await request(app).delete('/images/101').set('Cookie', ['session=fake-session']);
      expect(res.statusCode).toEqual(204);
    });
  });

  describe('DELETE /images/:imageId/likes', () => {
    it('should unlike an image and return 204', async () => {
      mockDbClient.imageExists.mockResolvedValue(true);
      mockDbClient.unlikeImage = jest.fn().mockResolvedValue(1);
      const res = await request(app).delete('/images/101/likes').set('Cookie', ['session=fake-session']);
      expect(res.statusCode).toEqual(204);
    });
  });
});
