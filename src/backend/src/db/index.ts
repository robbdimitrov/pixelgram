import { Pool, PoolClient, QueryResult } from 'pg';

import { hashToken } from '../shared/crypto';
import { mapUser, mapImage, mapSession } from '../shared/mappers';
import {
  ImageDto,
  ImageId,
  ImageRow,
  LoginFailureRow,
  SessionDto,
  SessionRow,
  UploadFilename,
  UserCredentialsRow,
  UserDto,
  UserId,
  UserRow
} from '../types';

class DbClient {
  pool: Pool;
  constructor(dbUrl: string | undefined) {
    this.pool = new Pool({
      connectionString: dbUrl,
      max: 10
    });
  }

  close(callback: () => void): void {
    this.pool.end(callback);
  }

  // Users

  createUser(name: string, username: string, email: string, password: string): Promise<UserId> {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO users (name, username, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`;

      this.pool.query<UserId>(query, [name, username, email, password])
        .then((result: QueryResult<UserId>) => resolve(result.rows[0]))
        .catch((error: unknown) => reject(error));
    });
  }

  getUserWithEmail(email: string): Promise<UserCredentialsRow | undefined> {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, password FROM users WHERE email = $1';

      this.pool.query<UserCredentialsRow>(query, [email])
        .then((result: QueryResult<UserCredentialsRow>) => resolve(result.rows[0]))
        .catch((error: unknown) => reject(error));
    });
  }

  getUserWithId(userId: string): Promise<UserCredentialsRow | undefined> {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, password FROM users WHERE id = $1';

      this.pool.query<UserCredentialsRow>(query, [userId])
        .then((result: QueryResult<UserCredentialsRow>) => resolve(result.rows[0]))
        .catch((error: unknown) => reject(error));
    });
  }

  getUser(userId: string): Promise<UserDto | undefined> {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, name, username, email, avatar, bio,
        (SELECT count(*) FROM images WHERE user_id = users.id) AS images,
        (SELECT count(*) FROM likes WHERE user_id = id) AS likes,
        time_format(created) AS created
        FROM users WHERE id = $1`;

      this.pool.query<UserRow>(query, [userId])
        .then((result: QueryResult<UserRow>) => {
          if (result.rows.length) {
            resolve(mapUser(result.rows[0]));
          } else {
            resolve(undefined);
          }
        }).catch((error: unknown) => reject(error));
    });
  }

  updateUser(userId: string, name: string, username: string, email: string, avatar: string | null, bio: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET name = $1, username = $2,
        email = $3, avatar = $4, bio = $5 WHERE id = $6`;

      this.pool.query(query, [name, username, email, avatar, bio, userId])
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }

  updatePassword(userId: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE users SET password = $1 WHERE id = $2';

      this.pool.query(query, [password, userId])
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }

  // Sessions

  createSession(sessionId: string, userId: string, expiresAt: Date): Promise<SessionDto> {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)
        RETURNING id, user_id, created, expires_at`;

      this.pool.query<SessionRow>(query, [hashToken(sessionId), userId, expiresAt])
        .then((result: QueryResult<SessionRow>) => resolve(mapSession(result.rows[0])))
        .catch((error: unknown) => reject(error));
    });
  }

  getSession(sessionId: string): Promise<SessionDto | undefined> {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, user_id, created, expires_at FROM sessions WHERE id = $1 AND expires_at > now()';

      this.pool.query<SessionRow>(query, [hashToken(sessionId)])
        .then((result: QueryResult<SessionRow>) => {
          if (result.rows.length) {
            resolve(mapSession(result.rows[0]));
          } else {
            resolve(undefined);
          }
        }).catch((error: unknown) => reject(error));
    });
  }

  refreshSession(sessionId: string, expiresAt: Date): Promise<SessionDto | undefined> {
    return new Promise((resolve, reject) => {
      const query =
        `UPDATE sessions SET expires_at = $2 WHERE id = $1 AND expires_at > now()
        RETURNING id, user_id, created, expires_at`;

      this.pool.query<SessionRow>(query, [hashToken(sessionId), expiresAt])
        .then((result: QueryResult<SessionRow>) => {
          if (result.rows.length) {
            resolve(mapSession(result.rows[0]));
          } else {
            resolve(undefined);
          }
        }).catch((error: unknown) => reject(error));
    });
  }

  deleteExpiredSessions(): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM sessions WHERE expires_at <= now()';

      this.pool.query(query)
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }

  deleteSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM sessions WHERE id = $1';

      this.pool.query(query, [hashToken(sessionId)])
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }

  deleteOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM sessions WHERE user_id = $1 AND id != $2';

      this.pool.query(query, [userId, hashToken(currentSessionId)])
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }

  // Login rate limiting

  getLoginFailures(keys: string[]): Promise<LoginFailureRow[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT key, count, reset_at FROM login_failures WHERE key = ANY($1)';

      this.pool.query<LoginFailureRow>(query, [keys])
        .then((result: QueryResult<LoginFailureRow>) => resolve(result.rows))
        .catch((error: unknown) => reject(error));
    });
  }

  recordLoginFailure(key: string, resetAt: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO login_failures (key, count, reset_at) VALUES ($1, 1, $2)
        ON CONFLICT (key) DO UPDATE SET
          count = CASE
            WHEN login_failures.reset_at <= now() THEN 1
            ELSE login_failures.count + 1
          END,
          reset_at = CASE
            WHEN login_failures.reset_at <= now() THEN EXCLUDED.reset_at
            ELSE login_failures.reset_at
          END`;

      this.pool.query(query, [key, resetAt])
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }

  clearLoginFailures(keys: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM login_failures WHERE key = ANY($1)';

      this.pool.query(query, [keys])
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }

  deleteExpiredLoginFailures(): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM login_failures WHERE reset_at <= now()';

      this.pool.query(query)
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }

  // Images

  createUpload(userId: string, filename: string): Promise<UploadFilename> {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO uploads (user_id, filename) VALUES ($1, $2)
        RETURNING filename`;

      this.pool.query<UploadFilename>(query, [userId, filename])
        .then((result: QueryResult<UploadFilename>) => resolve(result.rows[0]))
        .catch((error: unknown) => reject(error));
    });
  }

  createImage(userId: string, filename: string, description: string): Promise<ImageId | undefined> {
    return this.pool.connect().then(async (client: PoolClient) => {
      try {
        await client.query('BEGIN');

        const uploadQuery =
          `DELETE FROM uploads WHERE user_id = $1 AND filename = $2
          RETURNING filename`;
        const uploadResult = await client.query<UploadFilename>(uploadQuery, [userId, filename]);
        if (!uploadResult.rows.length) {
          await client.query('ROLLBACK');
          return undefined;
        }

        const imageQuery =
          `INSERT INTO images (user_id, filename, description)
          VALUES ($1, $2, $3) RETURNING id`;
        const imageResult = await client.query<ImageId>(imageQuery, [userId, filename, description]);
        await client.query('COMMIT');
        return imageResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    });
  }

  getFeed(page: number, limit: number, currentUserId: string): Promise<ImageDto[]> {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description,
        (SELECT count(*) FROM likes WHERE image_id = id) AS likes,
        EXISTS (SELECT 1 FROM likes
        WHERE image_id = id AND likes.user_id = $1) AS liked,
        time_format(created) AS created
        FROM images
        ORDER BY images.created DESC
        LIMIT $2 OFFSET $3`;

      this.pool.query<ImageRow>(query, [currentUserId, limit, page * limit])
        .then((result: QueryResult<ImageRow>) => resolve(result.rows.map((image: ImageRow) => mapImage(image))))
        .catch((error: unknown) => reject(error));
    });
  }

  getImages(userId: string, page: number, limit: number, currentUserId: string): Promise<ImageDto[]> {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description,
        (SELECT count(*) FROM likes WHERE image_id = id) AS likes,
        EXISTS (SELECT 1 FROM likes
        WHERE image_id = id AND likes.user_id = $1) AS liked,
        time_format(created) AS created
        FROM images WHERE user_id = $2
        ORDER BY images.created DESC
        LIMIT $3 OFFSET $4`;

      this.pool.query<ImageRow>(query, [currentUserId, userId, limit, page * limit])
        .then((result: QueryResult<ImageRow>) => resolve(result.rows.map((image: ImageRow) => mapImage(image))))
        .catch((error: unknown) => reject(error));
    });
  }

  getLikedImages(userId: string, page: number, limit: number, currentUserId: string): Promise<ImageDto[]> {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, images.user_id, filename, description,
        (SELECT count(*) FROM likes WHERE image_id = id) AS likes,
        EXISTS (SELECT 1 FROM likes
        WHERE image_id = id AND likes.user_id = $1) AS liked,
        time_format(images.created) AS created
        FROM images
        INNER JOIN likes ON image_id = id
        WHERE likes.user_id = $2
        ORDER BY likes.created DESC
        LIMIT $3 OFFSET $4`;

      this.pool.query<ImageRow>(query, [currentUserId, userId, limit, page * limit])
        .then((result: QueryResult<ImageRow>) => resolve(result.rows.map((image: ImageRow) => mapImage(image))))
        .catch((error: unknown) => reject(error));
    });
  }

  getImage(imageId: string, currentUserId: string): Promise<ImageDto | undefined> {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description,
        (SELECT count(*) FROM likes WHERE image_id = id) AS likes,
        EXISTS (SELECT 1 FROM likes
        WHERE image_id = id AND likes.user_id = $1) AS liked,
        time_format(created) AS created
        FROM images WHERE id = $2`;

      this.pool.query<ImageRow>(query, [currentUserId, imageId])
        .then((result: QueryResult<ImageRow>) => {
          if (result.rows.length) {
            resolve(mapImage(result.rows[0]));
          } else {
            resolve(undefined);
          }
        }).catch((error: unknown) => reject(error));
    });
  }

  imageExists(imageId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT EXISTS (SELECT 1 FROM images WHERE id = $1)';

      this.pool.query<{ exists: boolean }>(query, [imageId])
        .then((result: QueryResult<{ exists: boolean }>) => resolve(result.rows[0].exists))
        .catch((error: unknown) => reject(error));
    });
  }

  deleteImage(imageId: string, userId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM images WHERE id = $1 AND user_id = $2';

      this.pool.query(query, [imageId, userId])
        .then((result: QueryResult) => resolve(result.rowCount ?? 0))
        .catch((error: unknown) => reject(error));
    });
  }

  likeImage(imageId: string, userId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO likes (user_id, image_id)
        SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM images WHERE id = $2)
        ON CONFLICT DO NOTHING`;

      this.pool.query(query, [userId, imageId])
        .then((result: QueryResult) => resolve(result.rowCount ?? 0))
        .catch((error: unknown) => reject(error));
    });
  }

  unlikeImage(imageId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM likes WHERE user_id = $1 AND image_id = $2';

      this.pool.query(query, [userId, imageId])
        .then(() => resolve(undefined))
        .catch((error: unknown) => reject(error));
    });
  }
}

export default DbClient;
