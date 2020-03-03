const { Pool } = require('pg');

const logger = require('../tools/logger');

class DbClient {
  constructor(dbUrl) {
    this.pool = new Pool({
      connectionString: dbUrl,
      max: 3
    });
  }

  close() {
    this.pool.end();
  }

  //
  // Helpers
  //

  userWhereClause(identifier) {
    let type = 'username';
    if (Number.isInteger(identifier)) {
      type = 'id';
    } else if (identifier.contains('@')) {
      type = 'email';
    }
    return ` WHERE ${type} = $1`;
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

  getUserCredentials(identifier) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT id, password FROM users';
      query += this.userWhereClause(identifier);

      this.pool.query(query, [identifier])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting user: ${error}`);
          reject(error);
        });
    });
  }

  getUser(identifier) {
    return new Promise((resolve, reject) => {
      let query =
        `SELECT id, name, username, email, avatar, bio, created,
        (
          SELECT count(*) from likes where images.user_id = users.id
        ) as likes,
        (
          SELECT count(*) from images where images.user_id = users.id
        ) as likes,
        FROM users`;
      query += this.userWhereClause(identifier);

      this.pool.query(query, [identifier]).then((result) => {
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

  getAllUsers(query, page, limit) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, name, username, email, avatar, bio, created,
        (
          SELECT count(*) from likes where images.user_id = users.id
        ) as likes,
        (
          SELECT count(*) from images where images.user_id = users.id
        ) as likes,
        FROM users LIMIT $1 OFFSET $2`;

      this.pool.query(query, [limit, page * limit])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting users: ${error}`);
          reject('Getting users failed.');
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

      this.pool.query(query, [userId]).then(() => {
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

  getAllImages(page, limit, userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
        ) as is_liked
        FROM images LIMIT $2 OFFSET $3`;

      this.pool.query(query, [userId, limit, page * limit])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting images: ${error}`);
          reject(new Error('Getting images failed.'));
        });
    });
  }

  getImagesForUser(userId, page, limit, currentUserId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $4
        ) as is_liked
        FROM images WHERE user_id = $1
        LIMIT $2 OFFSET $3`;

      this.pool.query(query, [userId, limit, page * limit, currentUserId])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting images: ${error}`);
          reject(error);
        });
    });
  }

  getLikedImages(page, limit, userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created,
        true as is_liked
        FROM images WHERE id IN (
          SELECT image_id FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
          LIMIT $2 OFFSET $3
        )`;

      this.pool.query(query, [userId, limit, page * limit])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting images: ${error}`);
          reject(error);
        });
    });
  }

  createImage(image) {
    return new Promise((resolve, reject) => {
      const query =
        `INSERT INTO images (user_id, filename, description)
        VALUES ($1, $2, $3) RETURNING id`;

      this.pool.query(query, [image.userId, image.filename, image.description])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error creating image: ${error}`);
          reject(new Error('Creating image failed.'));
        });
    });
  }

  getImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $2
        ) as is_liked
        FROM images WHERE id = $1`;

      this.pool.query(query, [imageId, userId])
        .then((result) => {
          resolve(result);
        }).catch((error) => {
          logger.logError(`Error getting image: ${error}`);
          reject(new Error('Getting image failed.'));
        });
    });
  }

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

  deleteImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM images WHERE id = $1 and user_id = $2';

      this.pool.query(query, [imageId, userId]).then(() => {
        resolve();
      }).catch((error) => {
        logger.logError(`Error deleting image: ${error}`);
        reject(new Error('Deleting image failed.'));
      });
    });
  }
}

module.exports = DbClient;
