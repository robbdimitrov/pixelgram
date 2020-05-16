const { Pool } = require('pg');

const { mapUser, mapImage, mapSession } = require('../shared/mappers');

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
        .then((result) => resolve(mapUser(result.rows[0])))
        .catch((error) => reject(error));
    });
  }

  updateUser(userId, updates) {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE users SET ';
      const changes = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        values.push(value);
        changes.push(`${key} = $${values.length}`);
      }

      values.push(userId);
      query += changes.join(', ');
      query += ` WHERE id = $${values.length}`;

      this.pool.query(query, values)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  // Sessions

  createSession(sessionId, userId) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO sessions (id, user_id) VALUES ($1, $2)
        RETURNING id, user_id, created`;

      this.pool.query(query, [sessionId, userId])
        .then((result) => resolve(mapSession(result.rows[0])))
        .catch((error) => reject(error));
    });
  }

  getSession(sessionId) {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, user_id FROM sessions WHERE id = $1';

      this.pool.query(query, [sessionId])
        .then((result) => resolve(mapSession(result.rows[0])))
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

  createImage(userId, filename, description) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO images (user_id, filename, description)
        VALUES ($1, $2, $3) RETURNING id`;

      this.pool.query(query, [userId, filename, description])
        .then((result) => resolve(result.rows[0]))
        .catch((error) => reject(error));
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
        INNER JOIN likes ON images.id = likes.image_id
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
        .then((result) => resolve(mapImage(result.rows[0])))
        .catch((error) => reject(error));
    });
  }

  deleteImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM images WHERE id = $1 AND user_id = $2';

      this.pool.query(query, [imageId, userId])
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  likeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO likes (user_id, image_id) VALUES ($1, $2)';

      this.pool.query(query, [userId, imageId])
        .then(() => resolve())
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
