const { Pool } = require('pg');

const { isValidEmail } = require('../shared/utils');
const { generateHash } = require('../shared/crypto');
const { mapUser, mapImage, mapSession } = require('../shared/mappers');
const logger = require('../shared/logger');

class DbClient {
  constructor(dbUrl) {
    this.pool = new Pool({
      connectionString: dbUrl,
      max: 10
    });
  }

  close() {
    this.pool.end();
  }

  //
  // Users
  //

  createUser(name, username, email, password) {
    return new Promise((resolve, reject) => {
      if (!password) {
        return reject(new Error('Password can\'t be empty.'));
      }

      if (!isValidEmail(email)) {
        return reject(new Error('Invalid email address.'));
      }

      const query =
        `INSERT INTO users (name, username, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`;

      generateHash(password)
        .then((hash) => {
          const values = [name, username, email, hash];
          return this.pool.query(query, values);
        }).then((result) => {
          resolve(result.rows[0]);
        }).catch((error) => {
          logger.logError(`Creating user failed: ${error}`);

          if (error.message.includes('email')) {
            reject(new Error('User with this email already exists.'));
          } else if (error.message.includes('username')) {
            reject(new Error('User with this username already exists.'));
          } else {
            reject(new Error('Creating user failed.'));
          }
        });
    });
  }

  getUserCredentials(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, password FROM users WHERE email = $1';

      this.pool.query(query, [email])
        .then((result) => {
          resolve(result.rows[0]);
        }).catch((error) => {
          logger.logError(`Getting user credentials failed: ${error}`);
          reject(new Error('Getting user failed.'));
        });
    });
  }

  getUser(userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, name, username, email, avatar, bio,
        (
          SELECT count(*) FROM likes WHERE likes.user_id = users.id
        ) as likes,
        (
          SELECT count(*) FROM images WHERE images.user_id = users.id
        ) as images, created
        FROM users WHERE id = $1`;

      this.pool.query(query, [userId])
        .then((result) => {
          resolve(mapUser(result.rows[0]));
        }).catch((error) => {
          logger.logError(`Getting user failed: ${error}`);
          reject(new Error('Getting user failed.'));
        });
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
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Updating user failed: ${error}`);
          reject(new Error('Updating user failed.'));
        });
    });
  }

  //
  // Images
  //

  createImage(userId, filename, description) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO images (user_id, filename, description)
        VALUES ($1, $2, $3) RETURNING id`;

      this.pool.query(query, [userId, filename, description])
        .then((result) => {
          resolve(result.rows[0]);
        }).catch((error) => {
          logger.logError(`Creating image failed: ${error}`);
          reject(new Error('Creating image failed.'));
        });
    });
  }

  getImages(page, limit, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked, created
        FROM images LIMIT $2 OFFSET $3`;

      this.pool.query(query, [currentUserId, limit, page * limit])
        .then((result) => {
          resolve(result.rows.map(image => mapImage(image)));
        }).catch((error) => {
          logger.logError(`Getting images failed: ${error}`);
          reject(new Error('Getting images failed.'));
        });
    });
  }

  getImagesByUser(userId, page, limit, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked, created
        FROM images WHERE user_id = $2
        LIMIT $3 OFFSET $4`;

      this.pool.query(query, [currentUserId, userId, limit, page * limit])
        .then((result) => {
          resolve(result.rows.map(image => mapImage(image)));
        }).catch((error) => {
          logger.logError(`Getting images failed: ${error}`);
          reject(new Error('Getting images failed.'));
        });
    });
  }

  getImagesLikedByUser(userId, page, limit, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked, created
        FROM images WHERE id IN (
          SELECT image_id FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $2
          LIMIT $3 OFFSET $4
        )`;

      this.pool.query(query, [currentUserId, userId, limit, page * limit])
        .then((result) => {
          resolve(result.rows.map(image => mapImage(image)));
        }).catch((error) => {
          logger.logError(`Getting images failed: ${error}`);
          reject(new Error('Getting images failed.'));
        });
    });
  }

  getImage(imageId, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked, created
        FROM images WHERE id = $2`;

      this.pool.query(query, [currentUserId, imageId])
        .then((result) => {
          resolve(mapImage(result.rows[0]));
        }).catch((error) => {
          logger.logError(`Getting image failed: ${error}`);
          reject(new Error('Getting image failed.'));
        });
    });
  }

  deleteImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM images WHERE id = $1 and user_id = $2';

      this.pool.query(query, [imageId, userId])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Deleting image failed: ${error}`);
          reject(new Error('Deleting image failed.'));
        });
    });
  }

  //
  // Likes
  //

  likeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO likes (user_id, image_id) VALUES ($1, $2)';

      this.pool.query(query, [userId, imageId])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Liking image failed: ${error}`);
          reject(new Error('Liking image failed.'));
        });
    });
  }

  unlikeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM likes WHERE user_id = $1 AND image_id = $2';

      this.pool.query(query, [userId, imageId])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Unliking image failed: ${error}`);
          reject(new Error('Unliking image failed.'));
        });
    });
  }

  //
  // Sessions
  //

  createSession(sessionId, userId, userAgent) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO sessions (id, user_id, user_agent)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, user_agent`;

      this.pool.query(query, [sessionId, userId, userAgent])
        .then((result) => {
          resolve(mapSession(result.rows[0]));
        }).catch((error) => {
          logger.logError(`Creating session failed: ${error}`);
          reject(new Error('Creating session failed.'));
        });
    });
  }

  getSession(sessionId) {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, user_id, user_agent FROM sessions WHERE id = $1';

      this.pool.query(query, [sessionId])
        .then((result) => {
          resolve(mapSession(result.rows[0]));
        }).catch((error) => {
          logger.logError(`Getting session failed: ${error}`);
          reject(new Error('Getting session failed.'));
        });
    });
  }

  deleteSession(sessionId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM sessions WHERE id = $1';

      this.pool.query(query, [sessionId])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Deleting session failed: ${error}`);
          reject(new Error('Deleting session failed.'));
        });
    });
  }
}

module.exports = DbClient;
