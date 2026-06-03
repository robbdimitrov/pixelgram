import request from 'supertest';
import createApp from '../src/index';
import { generateHash } from '../src/shared/crypto';

const mockDbClient = {
  getSession: jest.fn(),
  refreshSession: jest.fn(),
  getUser: jest.fn(),
  updateUser: jest.fn(),
  getUserWithId: jest.fn(),
  updatePassword: jest.fn(),
  deleteOtherSessions: jest.fn()
} as any;

const app = createApp(mockDbClient, '/tmp');

describe('User Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbClient.getSession.mockResolvedValue({ id: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAA', userId: '1' });
    mockDbClient.refreshSession.mockResolvedValue({ id: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAA', userId: '1' });
    mockDbClient.deleteOtherSessions.mockResolvedValue(undefined);
  });

  describe('GET /users/:userId', () => {
    it('should fetch the user profile', async () => {
      const mockUser = {
        id: '2',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      };
      mockDbClient.getUser.mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/users/2')
        .set('Cookie', ['session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA']);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockUser);
      expect(mockDbClient.getUser).toHaveBeenCalledWith('2');
    });

    it('should return 404 if user not found', async () => {
      mockDbClient.getUser.mockResolvedValue(undefined);

      const res = await request(app)
        .get('/users/999')
        .set('Cookie', ['session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA']);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /users/:userId', () => {
    it('should update user if authorized', async () => {
      mockDbClient.updateUser.mockResolvedValue(undefined);

      const res = await request(app)
        .put('/users/1') // Logged in as user '1'
        .set('Cookie', ['session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA'])
        .send({
          name: 'Updated Name',
          username: 'updated',
          email: 'updated@example.com'
        });

      expect(res.statusCode).toEqual(204);
      expect(mockDbClient.updateUser).toHaveBeenCalledWith('1', 'Updated Name', 'updated', 'updated@example.com', undefined, undefined);
    });

    it('should return 403 when updating another user profile', async () => {
      const res = await request(app)
        .put('/users/2') // Trying to update user '2' while logged in as '1'
        .set('Cookie', ['session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA'])
        .send({
          name: 'Hacked',
          username: 'hacked',
          email: 'hacked@example.com'
        });

      expect(res.statusCode).toEqual(403);
      expect(mockDbClient.updateUser).not.toHaveBeenCalled();
    });

    it('should return 400 if new password is too short', async () => {
      const res = await request(app)
        .put('/users/1') // Logged in as user '1'
        .set('Cookie', ['session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA'])
        .send({
          oldPassword: 'oldpassword123',
          password: 'short'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Password must be at least 8 characters long.');
    });

    it('should revoke other sessions after changing password', async () => {
      const passwordHash = await generateHash('oldpassword123');
      mockDbClient.getUserWithId.mockResolvedValue({ id: '1', password: passwordHash });
      mockDbClient.updatePassword.mockResolvedValue(undefined);

      const res = await request(app)
        .put('/users/1')
        .set('Cookie', ['session=AAAAAAAAAAAAAAAAAAAAAAAAAAAA'])
        .send({
          oldPassword: 'oldpassword123',
          password: 'newpassword123'
        });

      expect(res.statusCode).toEqual(204);
      expect(mockDbClient.updatePassword).toHaveBeenCalled();
      expect(mockDbClient.deleteOtherSessions).toHaveBeenCalledWith(
        '1',
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      );
    });
  });
});
