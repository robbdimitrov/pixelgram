const { Pool } = require('pg');

class ImageClient {
  constructor(dbUrl) {
    this.pool = new Pool({
      connectionString: dbUrl
    });
  }

  close() {
    this.pool.end();
  }

  async getAllImages(page, limit, userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created_at,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.id = images.id
          and likes.user_id = $1
        ) as is_liked
        FROM images LIMIT $2 OFFSET $3`

      this.pool.query(query, [userId, limit, page * limit])
        .then((res) => {
          resolve(res);
        }).catch((error) => {
          Logger.logError(`Error getting images: ${error}`);
          return reject(error);
        });
    });
  }

  async getOwnImages(page, limit, userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created_at,
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.id = images.id
          and likes.user_id = $1
        ) as is_liked
        FROM images WHERE user_id = $1
        LIMIT $2 OFFSET $3`

      this.pool.query(query, [userId, limit, page * limit])
        .then((res) => {
          resolve(res);
        }).catch((error) => {
          Logger.logError(`Error getting images: ${error}`);
          return reject(error);
        });
    });
  }

  async getLikedImages(page, limit, userId) {
    return new Promise((resolve, reject) => {
      const query =
        `SELECT id, user_id, filename, description, created_at,
        true as is_liked
        FROM images WHERE id IN (
          SELECT image_id FROM likes
          WHERE likes.image_id = images.id
          and likes.user_id = $1
          LIMIT $2 OFFSET $3
        )`

      this.pool.query(query, [userId, limit, page * limit])
        .then((res) => {
          resolve(res);
        }).catch((error) => {
          Logger.logError(`Error getting images: ${error}`);
          return reject(error);
        });
    });
  }

  async createImage(image) {
    return new Promise((resolve, reject) => {
      client.db().collection('images').insertOne(image, (error, result) => {
        if (error) {
          Logger.logError(`Error creating image: ${error}`);
          return reject(error);
        }

        const imageId = result.insertedId;

        client.db().collection('users').updateOne({ id: image.ownerId },
          { $push: { postedImages: imageId } })
          .then(() => resolve(imageId))
          .catch((error) => reject(error));
      });
    });
  }

  async getImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      client.db().collection('images').aggregate([
        { $match: { id: imageId } },
        { $project: this.imageAggregationProperties(userId) }
      ], (error, result) => {
        if (error) {
          Logger.logError(`Error getting image: ${error}`);
          return reject(error);
        }
        result.toArray().then((res) => {
          resolve(this.addCreationTimestamps(res)[0]);
        }).catch((error) => {
          Logger.logError(`Error getting image: ${error}`);
          reject(new Error('Something went wrong.'));
        });
      });
    });
  }

  async updateImage(imageId, imageUpdates) {
    return new Promise((resolve, reject) => {
      client.db().collection('images').updateOne({ id: imageId }, imageUpdates)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  async deleteImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      client.db().collection('images').deleteOne({
        id: imageId, userId: userId
      }).then((result) => {
        if (result.deletedCount !== 0) {
          client.db().collection('users').updateMany({},
            { $pull: { likedImages: imageId, postedImages: imageId } },
            { multi: true })
            .then(() => resolve());
        } else {
          reject(new Error('Image not existing or owned by other user.'));
        }
      }).catch((error) => {
        Logger.logError(`Error deleting user: ${error}`);
        reject(new Error('Something went wrong.'));
      });
    });
  }
}

module.exports = ImageClient;
