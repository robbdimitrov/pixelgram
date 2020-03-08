const { Pool } = require('pg');

const { isValidEmail } = require('../shared/utils');
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

      this.authService.generateHash(password).then((hash) => {
        const values = [name, username, email, hash];
        return this.pool.query(query, values);
      }).then((result) => {
        resolve(result);
      }).catch((error) => {
        logger.logError(`Error creating user: ${error}`);

        if (error.message.includes('email')) {
          reject(new Error('User with this email already exists.'));
        } else if (error.message.includes('username')) {
          reject(new Error('User with this username already exists.'));
        } else {
          reject(new Error('Error creating user.'));
        }
      });
    });
  }

  getUserCredentials(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT id, password FROM users WHERE email = $1';

      this.pool.query(query, [email])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting user: ${error}`);
          reject(error);
        });
    });
  }

  getUser(userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, name, username, email, avatar, bio, created,
        (
          SELECT count(*) from likes where images.user_id = users.id
        ) as likes,
        (
          SELECT count(*) from images where images.user_id = users.id
        ) as likes,
        FROM users WHERE id = $1`;

      this.pool.query(query, [userId]).then((result) => {
        if (!result.length) {
          reject(new Error('User not found.'));
        } else {
          resolve(result);
        }
      }).catch((error) => {
        logger.logError(`Error getting user: ${error}`);
        reject(new Error('Getting user failed.'));
      });
    });
  }

  updateUser(userId, updates) {
    return new Promise((resolve, reject) => {
      this.validateUpdates(userId, updates).then((updates) => {
        let query = 'UPDATE users SET ';
        const changes = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
          values.push(value);
          changes.push(`${key} = $${values.length}`);
        }

        query += values.join(', ');

        values.push(userId);
        query += ` WHERE id = $${values.length}`;

        return this.pool.query(query, values);
      }).then(() => {
        resolve();
      }).catch((error) => {
        logger.logError(`Error updating user: ${error}`);
        reject(new Error('Updating user failed.'));
      });
    });
  }

  deleteUser(userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = $1';

      this.pool.query(query, [userId])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Error deleting user: ${error}`);
          reject(new Error('Deleting user failed.'));
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
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error creating image: ${error}`);
          reject(new Error('Creating image failed.'));
        });
    });
  }

  getImages(page, limit, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked
        FROM images LIMIT $2 OFFSET $3`;

      this.pool.query(query, [currentUserId, limit, page * limit])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting images: ${error}`);
          reject(new Error('Getting images failed.'));
        });
    });
  }

  getImagesByUser(userId, page, limit, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked
        FROM images WHERE user_id = $2
        LIMIT $3 OFFSET $4`;

      this.pool.query(query, [currentUserId, userId, limit, page * limit])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting images: ${error}`);
          reject(error);
        });
    });
  }

  getImagesLikedByUser(userId, page, limit, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked
        FROM images WHERE id IN (
          SELECT image_id FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $2
          LIMIT $3 OFFSET $4
        )`;

      this.pool.query(query, [currentUserId, userId, limit, page * limit])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting images: ${error}`);
          reject(error);
        });
    });
  }

  getImage(imageId, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked
        FROM images WHERE id = $2`;

      this.pool.query(query, [currentUserId, imageId])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting image: ${error}`);
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
          logger.logError(`Error deleting image: ${error}`);
          reject(new Error('Deleting image failed.'));
        });
    });
  }

  //
  // Likes
  //

  likeImage(userId, imageId) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO likes (user_id, image_id) VALUES ($1, $2)';

      this.pool.query(query, [userId, imageId])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Error liking image: ${error}`);
          reject(new Error('Liking image failed.'));
        });
    });
  }

  unlikeImage(userId, imageId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM likes WHERE user_id = $1 AND image_id = $2';

      this.pool.query(query, [userId, imageId])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Error unliking image: ${error}`);
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
        'INSERT INTO sessions (id, user_id, user_agent) VALUES ($1, $2, $3)';

      this.pool.query(query, [sessionId, userId, userAgent])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Error creating session: ${error}`);
          reject(new Error('Creating session failed.'));
        });
    });
  }

  getSession(sessionId) {
    return new Promise((resolve, reject) => {
      const query =
        'SELECT id, user_id, user_agent FROM sessions WHERE id = $1';

      this.pool.query(query, [sessionId])
        .then(() => {
          resolve();
        }).catch((error) => {
          logger.logError(`Error getting session: ${error}`);
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
          logger.logError(`Error deleting session: ${error}`);
          reject(new Error('Deleting session failed.'));
        });
    });
  }
}

module.exports = DbClient;
