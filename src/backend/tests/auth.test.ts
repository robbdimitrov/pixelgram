import request from 'supertest';
import createApp from '../src/index';

// Create a mock DB Client
const mockDbClient = {
  getUserWithEmail: jest.fn(),
  createUser: jest.fn(),
  createSession: jest.fn(),
  getUser: jest.fn(),
  deleteExpiredSessions: jest.fn(),
  getSession: jest.fn(),
  refreshSession: jest.fn(),
  deleteSession: jest.fn()
} as any;

const app = createApp(mockDbClient, '/tmp');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbClient.deleteExpiredSessions.mockResolvedValue(undefined);
  });

  describe('POST /sessions (Login)', () => {
    it('should return 401 for invalid credentials', async () => {
      mockDbClient.getUserWithEmail.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/sessions')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Incorrect email or password.');
    });
  });

  describe('session validation', () => {
    it('should not clear the session cookie when validation fails with a server error', async () => {
      mockDbClient.getSession.mockRejectedValue(new Error('database unavailable'));

      const res = await request(app)
        .get('/images')
        .set('Cookie', ['session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA']);

      expect(res.statusCode).toEqual(500);
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('should clear the session cookie when the session is invalid', async () => {
      mockDbClient.getSession.mockResolvedValue(undefined);

      const res = await request(app)
        .get('/images')
        .set('Cookie', ['session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA']);

      expect(res.statusCode).toEqual(401);
      expect(res.headers['set-cookie']?.[0]).toContain('session=');
      expect(res.headers['set-cookie']?.[0]).toContain('Expires=');
    });

    it('should reject malformed session cookies without hitting the database', async () => {
      const res = await request(app)
        .get('/images')
        .set('Cookie', ['session=not-a-valid-session']);

      expect(res.statusCode).toEqual(401);
      expect(mockDbClient.getSession).not.toHaveBeenCalled();
      expect(res.headers['set-cookie']?.[0]).toContain('session=');
    });
  });

  describe('DELETE /sessions (Logout)', () => {
    it('should clear malformed session cookies without hitting the database', async () => {
      const res = await request(app)
        .delete('/sessions')
        .set('Cookie', ['session=not-a-valid-session']);

      expect(res.statusCode).toEqual(204);
      expect(mockDbClient.deleteSession).not.toHaveBeenCalled();
      expect(res.headers['set-cookie']?.[0]).toContain('session=');
    });
  });

  describe('POST /users (Register)', () => {
    it('should return 409 if user already exists', async () => {
      mockDbClient.getUserWithEmail.mockResolvedValue({ id: '1' });
      // We need to mock user-controller for POST /users
      // Actually, since this is testing the app as a whole, it goes to UserController.createUser
      // Let's assume the mock is configured for it.
      // For now, let's just test that the endpoints exist and respond.
      
      // user.createUser check DB. Let's mock createUser to reject with 'User already exists'
      mockDbClient.createUser.mockRejectedValue({ code: '23505' });

      const res = await request(app)
        .post('/users')
        .send({
          name: 'Test',
          username: 'test',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('message', 'User with this username or email already exists.');
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          name: 'Test',
          username: 'test',
          email: 'test@example.com',
          password: 'short'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Password must be at least 8 characters long.');
    });
  });
});
