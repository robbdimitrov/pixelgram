import request from 'supertest';
import createApp from '../src/index';
import path from 'path';

const mockDbClient = {
  getSession: jest.fn(),
  refreshSession: jest.fn(),
  createUpload: jest.fn()
} as any;

// Use /tmp for mock uploads
const app = createApp(mockDbClient, '/tmp');

describe('Upload Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbClient.getSession.mockResolvedValue({ id: 'fake-session', userId: '1' });
    mockDbClient.refreshSession.mockResolvedValue({ id: 'fake-session', userId: '1' });
  });

  describe('POST /uploads', () => {
    it('should reject if file is missing', async () => {
      const res = await request(app)
        .post('/uploads')
        .set('Cookie', ['session=fake-session']);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'File missing from request.');
    });

    it('should reject non-image files', async () => {
      // Send a plain text file buffer
      const txtBuffer = Buffer.from('this is not an image');

      const res = await request(app)
        .post('/uploads')
        .set('Cookie', ['session=fake-session'])
        .attach('image', txtBuffer, 'test.txt');

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Only image uploads are allowed.');
    });

    it('should accept valid image signatures', async () => {
      // JPEG magic bytes: FF D8 FF
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00, 0x00]);
      
      mockDbClient.createUpload.mockResolvedValue(true);

      const res = await request(app)
        .post('/uploads')
        .set('Cookie', ['session=fake-session'])
        .attach('image', jpegBuffer, 'test.jpg');

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('filename');
      expect(mockDbClient.createUpload).toHaveBeenCalled();
    });
  });
});
