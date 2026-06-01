import request from 'supertest';
import createApp from '../src/index';

// Create a mock DB Client
const mockDbClient = {
  getUserWithEmail: jest.fn(),
  createUser: jest.fn(),
  createSession: jest.fn(),
  getUser: jest.fn(),
  deleteExpiredSessions: jest.fn()
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
  });
});
