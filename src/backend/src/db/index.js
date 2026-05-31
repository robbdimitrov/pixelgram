const {Pool} = require('pg');

const {mapUser, mapImage, mapSession} = require('../shared/mappers');

class DbClient {
  constructor(dbUrl) {
    this.pool = new Pool({
      connectionString: dbUrl,
      max: 10
    });
  }

  close(callback) {
    this.pool.end(callback);
  }

  // Users

  createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO users (name, username, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`;

      this.pool.query(query, [name, username, email, password])
        .then((result) => resolve(result.rows[0]))
        .catch((error) => reject(error));
    });
  }

  getUserWithEmail(email) {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, password FROM users WHERE email = $1';

      this.pool.query(query, [email])
        .then((result) => resolve(result.rows[0]))
        .catch((error) => reject(error));
    });
  }

  getUserWithId(userId) {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, password FROM users WHERE id = $1';

      this.pool.query(query, [userId])
        .then((result) => resolve(result.rows[0]))
        .catch((error) => reject(error));
    });
  }

  getUser(userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, name, username, email, avatar, bio,
        (SELECT count(*) FROM images WHERE user_id = users.id) AS images,
        (SELECT count(*) FROM likes WHERE user_id = id) AS likes,
        time_format(created) AS created
        FROM users WHERE id = $1`;

      this.pool.query(query, [userId])
        .then((result) => {
          if (result.rows.length) {
            resolve(mapUser(result.rows[0]));
          } else {
            resolve(undefined);
          }
        }).catch((error) => reject(error));
    });
  }

  updateUser(userId, name, username, email, avatar, bio) {
    return new Promise((resolve, reject) => {
      let query = `UPDATE users SET name = $1, username = $2,
        email = $3, avatar = $4, bio = $5 WHERE id = $6`;

      this.pool.query(query, [name, username, email, avatar, bio, userId])
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  updatePassword(userId, password) {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE users SET password = $1 WHERE id = $2';

      this.pool.query(query, [password, userId])
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  // Sessions

  createSession(sessionId, userId, expiresAt) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)
        RETURNING id, user_id, created, expires_at`;

      this.pool.query(query, [sessionId, userId, expiresAt])
        .then((result) => resolve(mapSession(result.rows[0])))
        .catch((error) => reject(error));
    });
  }

  getSession(sessionId) {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, user_id, created, expires_at FROM sessions WHERE id = $1 AND expires_at > now()';

      this.pool.query(query, [sessionId])
        .then((result) => {
          if (result.rows.length) {
            resolve(mapSession(result.rows[0]));
          } else {
            resolve(undefined);
          }
        }).catch((error) => reject(error));
    });
  }

  refreshSession(sessionId, expiresAt) {
    return new Promise((resolve, reject) => {
      const query =
        `UPDATE sessions SET expires_at = $2 WHERE id = $1 AND expires_at > now()
        RETURNING id, user_id, created, expires_at`;

      this.pool.query(query, [sessionId, expiresAt])
        .then((result) => {
          if (result.rows.length) {
            resolve(mapSession(result.rows[0]));
          } else {
            resolve(undefined);
          }
        }).catch((error) => reject(error));
    });
  }

  deleteExpiredSessions() {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM sessions WHERE expires_at <= now()';

      this.pool.query(query)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  deleteSession(sessionId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM sessions WHERE id = $1';

      this.pool.query(query, [sessionId])
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  // Images

  createUpload(userId, filename) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO uploads (user_id, filename) VALUES ($1, $2)
        RETURNING filename`;

      this.pool.query(query, [userId, filename])
        .then((result) => resolve(result.rows[0]))
        .catch((error) => reject(error));
    });
  }

  createImage(userId, filename, description) {
    return this.pool.connect().then(async (client) => {
      try {
        await client.query('BEGIN');

        const uploadQuery =
          `DELETE FROM uploads WHERE user_id = $1 AND filename = $2
          RETURNING filename`;
        const uploadResult = await client.query(uploadQuery, [userId, filename]);
        if (!uploadResult.rows.length) {
          await client.query('ROLLBACK');
          return undefined;
        }

        const imageQuery =
          `INSERT INTO images (user_id, filename, description)
          VALUES ($1, $2, $3) RETURNING id`;
        const imageResult = await client.query(imageQuery, [userId, filename, description]);
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

  getFeed(page, limit, currentUserId) {
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

      this.pool.query(query, [currentUserId, limit, page * limit])
        .then((result) => resolve(result.rows.map(image => mapImage(image))))
        .catch((error) => reject(error));
    });
  }

  getImages(userId, page, limit, currentUserId) {
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

      this.pool.query(query, [currentUserId, userId, limit, page * limit])
        .then((result) => resolve(result.rows.map(image => mapImage(image))))
        .catch((error) => reject(error));
    });
  }

  getLikedImages(userId, page, limit, currentUserId) {
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

      this.pool.query(query, [currentUserId, userId, limit, page * limit])
        .then((result) => resolve(result.rows.map(image => mapImage(image))))
        .catch((error) => reject(error));
    });
  }

  getImage(imageId, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description,
        (SELECT count(*) FROM likes WHERE image_id = id) AS likes,
        EXISTS (SELECT 1 FROM likes
        WHERE image_id = id AND likes.user_id = $1) AS liked,
        time_format(created) AS created
        FROM images WHERE id = $2`;

      this.pool.query(query, [currentUserId, imageId])
        .then((result) => {
          if (result.rows.length) {
            resolve(mapImage(result.rows[0]));
          } else {
            resolve(undefined);
          }
        }).catch((error) => reject(error));
    });
  }

  imageExists(imageId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT EXISTS (SELECT 1 FROM images WHERE id = $1)';

      this.pool.query(query, [imageId])
        .then((result) => resolve(result.rows[0].exists))
        .catch((error) => reject(error));
    });
  }

  deleteImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM images WHERE id = $1 AND user_id = $2';

      this.pool.query(query, [imageId, userId])
        .then((result) => resolve(result.rowCount))
        .catch((error) => reject(error));
    });
  }

  likeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO likes (user_id, image_id)
        SELECT $1, $2 WHERE EXISTS (SELECT 1 FROM images WHERE id = $2)
        ON CONFLICT DO NOTHING`;

      this.pool.query(query, [userId, imageId])
        .then((result) => resolve(result.rowCount))
        .catch((error) => reject(error));
    });
  }

  unlikeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM likes WHERE user_id = $1 AND image_id = $2';

      this.pool.query(query, [userId, imageId])
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }
}

module.exports = DbClient;
