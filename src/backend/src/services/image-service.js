const { Pool } = require('pg');

const Logger = require('../tools/logger');

class ImageService {
  constructor(dbUrl) {
    this.pool = new Pool({
      connectionString: dbUrl,
      max: 2
    });
  }

  close() {
    this.pool.end();
  }

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
          Logger.logError(`Error getting images: ${error}`);
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
          Logger.logError(`Error getting images: ${error}`);
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
          Logger.logError(`Error getting images: ${error}`);
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
          Logger.logError(`Error creating image: ${error}`);
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
          Logger.logError(`Error getting image: ${error}`);
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
          Logger.logError(`Error liking image: ${error}`);
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
          Logger.logError(`Error unliking image: ${error}`);
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
        Logger.logError(`Error deleting image: ${error}`);
        reject(new Error('Deleting image failed.'));
      });
    });
  }
}

module.exports = ImageService;
