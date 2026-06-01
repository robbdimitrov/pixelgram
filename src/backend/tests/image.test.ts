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
});
