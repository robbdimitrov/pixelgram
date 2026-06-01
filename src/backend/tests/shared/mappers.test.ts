import { mapUser, mapSession, mapImage } from '../../src/shared/mappers';

describe('mappers', () => {
  describe('mapUser', () => {
    it('should correctly map user properties', () => {
      const input = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'avatar.png',
        bio: 'Test bio',
        images: '10',
        likes: '20',
        created: '2023-01-01T00:00:00Z',
        extraField: 'should be ignored'
      };

      const result = mapUser(input);

      expect(result).toEqual({
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        avatar: 'avatar.png',
        bio: 'Test bio',
        images: 10,
        likes: 20,
        created: '2023-01-01T00:00:00Z'
      });
    });
  });

  describe('mapSession', () => {
    it('should correctly map session properties', () => {
      const input = {
        id: 'session-id',
        user_id: 2,
        created: '2023-01-01T00:00:00Z',
        expires_at: '2023-01-02T00:00:00Z',
        extraField: 'ignored'
      };

      const result = mapSession(input);

      expect(result).toEqual({
        id: 'session-id',
        userId: 2,
        created: '2023-01-01T00:00:00Z',
        expiresAt: '2023-01-02T00:00:00Z'
      });
    });
  });

  describe('mapImage', () => {
    it('should correctly map image properties', () => {
      const input = {
        id: 3,
        user_id: 4,
        filename: 'image.jpg',
        description: 'Test image',
        likes: '15',
        liked: true,
        created: '2023-01-01T00:00:00Z',
        extraField: 'ignored'
      };

      const result = mapImage(input);

      expect(result).toEqual({
        id: 3,
        userId: 4,
        filename: 'image.jpg',
        description: 'Test image',
        likes: 15,
        liked: true,
        created: '2023-01-01T00:00:00Z'
      });
    });
  });
});
