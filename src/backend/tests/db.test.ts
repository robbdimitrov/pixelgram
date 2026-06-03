import DbClient from '../src/db';
import { hashToken } from '../src/shared/crypto';

const mockQuery = jest.fn();
const mockEnd = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
    end: mockEnd
  }))
}));

describe('DbClient session storage', () => {
  const rawSessionId = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const hashedSessionId = hashToken(rawSessionId);
  let dbClient: DbClient;

  beforeEach(() => {
    jest.clearAllMocks();
    dbClient = new DbClient('postgres://test');
  });

  function expectQueryParams(expectedParams: unknown[]) {
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), expectedParams);
    expect(JSON.stringify(mockQuery.mock.calls[0])).not.toContain(rawSessionId);
  }

  it('should store only a hashed session token', async () => {
    const expiresAt = new Date('2026-01-01T00:00:00.000Z');
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: hashedSessionId,
        user_id: 1,
        created: new Date('2025-01-01T00:00:00.000Z'),
        expires_at: expiresAt
      }]
    });

    await dbClient.createSession(rawSessionId, '1', expiresAt);

    expectQueryParams([hashedSessionId, '1', expiresAt]);
  });

  it('should look up sessions by hashed token', async () => {
    mockQuery.mockResolvedValueOnce({rows: []});

    await dbClient.getSession(rawSessionId);

    expectQueryParams([hashedSessionId]);
  });

  it('should refresh sessions by hashed token', async () => {
    const expiresAt = new Date('2026-01-01T00:00:00.000Z');
    mockQuery.mockResolvedValueOnce({rows: []});

    await dbClient.refreshSession(rawSessionId, expiresAt);

    expectQueryParams([hashedSessionId, expiresAt]);
  });

  it('should delete sessions by hashed token', async () => {
    mockQuery.mockResolvedValueOnce({rows: []});

    await dbClient.deleteSession(rawSessionId);

    expectQueryParams([hashedSessionId]);
  });

  it('should preserve the current session by hashed token when deleting other sessions', async () => {
    mockQuery.mockResolvedValueOnce({rows: []});

    await dbClient.deleteOtherSessions('1', rawSessionId);

    expectQueryParams(['1', hashedSessionId]);
  });
});
