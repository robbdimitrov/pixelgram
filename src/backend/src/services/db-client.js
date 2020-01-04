const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const Logger = require('./logger');

class DBClient {
  constructor(dbUrl) {
    this.url = dbUrl;
  }

  // Database connection methods

  establishConnection(url) {
    return new Promise((resolve, reject) => {
      if (this.client) {
        return resolve(this.client);
      }

      const options = { useNewUrlParser: true, useUnifiedTopology: true };
      MongoClient.connect(url, options).then((result) => {
        this.client = result;
        resolve(this.client);
      }).catch((error) => {
        Logger.logError(`Error connecting to database: ${error}`);
        reject(error);
      });
    });
  }

  async get() {
    return await this.establishConnection(this.url);
  }

  closeConnection() {
    return new Promise((resolve, reject) => {
      this.client.close().then(() => {
        this.client = undefined;
        resolve();
      }).catch((error) => {
        Logger.logError(`Error closing database connection: ${error}`);
        reject(error);
      });
    });
  }

  // Aggregation

  userAggregationProperties(raw = false) {
    const properties = {
      name: 1,
      username: 1,
      email: 1,
      bio: 1,
      avatar: 1,
      likes: { $size: '$likedImages' },
      images: { $size: '$postedImages' }
    };

    if (raw) {
      properties['password'] = 1;
    }

    return properties;
  }

  imageAggregationProperties(userId) {
    const properties = {
      ownerId: 1,
      filename: 1,
      description: 1,
      likes: { $size: '$likedUsers' }
    };

    if (userId !== undefined) {
      properties['isLiked'] = { $in: [ new ObjectID(userId), '$likedUsers' ] };
    }

    return properties;
  }

  // Image methods

  addCreationTimestamp(value) {
    const createdAt = value._id.getTimestamp();
    const object = { ...value,  createdAt };
    return object;
  }

  addCreationTimestamps(values) {
    return values.map((value) => this.addCreationTimestamp(value));
  }

  /**
   * Returns all images or their count for a given query.
   *
   * @param query used for searching the images
   * @param page current page of content
   * @param limit number of items per page
   * @param countOnly if true, function returns just count. Default is false.
   * @param userId used for checking if the current user has liked the image
   * @returns Promise with either image array or count
   */
  async getAllImages(query, page, limit, countOnly = false, userId) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      if (countOnly) {
        client.db().collection('images').find(query, { _id: 1 })
          .count().then((res) => resolve(res))
          .catch((error) => reject(error));
      } else {
        client.db().collection('images').aggregate([
          { $match: query },
          { $project: this.imageAggregationProperties(userId) }
        ]).sort({ _id: -1 }).skip(page * limit).limit(limit).toArray((error, result) => {
          if (error) {
            Logger.logError(`Error getting images: ${error}`);
            return reject(error);
          }
          resolve(this.addCreationTimestamps(result));
        });
      }
    });
  }

  /**
   * Creates an image in the database for a given Image object
   *
   * @param user the image to be inserted in the database
   * @returns Promise with the write operation result
   */
  async createImage(image) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('images').insertOne(image, (error, result) => {
        if (error) {
          Logger.logError(`Error creating image: ${error}`);
          return reject(error);
        }

        const imageId = result.insertedId;

        client.db().collection('users').updateOne({ _id: image.ownerId },
          { $push: { postedImages: imageId } })
          .then(() => resolve(imageId))
          .catch((error) => reject(error));
      });
    });
  }

  /**
   * Returns a Promise with image object with a given id
   *
   * @param imageId id of the image
   * @param userId used for checking if the current user has liked the image
   * @returns Promise with Image Object
   */
  async getImage(imageId, userId) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('images').aggregate([
        { $match: { _id: new ObjectID(imageId) } },
        { $project: this.imageAggregationProperties(userId) }
      ], (error, result) => {
        if (error) {
          Logger.logError(`Error getting image: ${error}`);
          return reject(error);
        }
        result.toArray().then((res) => {
          resolve(this.addCreationTimestamp(res[0]));
        }).catch((error) => {
          Logger.logError(`Error getting image: ${error}`);
          reject(new Error('Something went wrong.'));
        });
      });
    });
  }

  /**
   * Updates an image with a given id
   *
   * @param imageId id of the image
   * @param imageUpdates JS Object with the updated values
   * @returns Promise with empty object or error
   */
  async updateImage(imageId, imageUpdates) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('images').updateOne({ _id: new ObjectID(imageId) }, imageUpdates)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  /**
   * Deletes an image with a given id
   *
   * @param userId id of the owner
   * @param imageId id of the image
   * @returns Promise with empty object or error
   */
  async deleteImage(imageId, userId) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      const userObjectId = new ObjectID(userId);
      const imageObjectId = new ObjectID(imageId);

      client.db().collection('images').deleteOne({
        _id: imageObjectId, ownerId: userObjectId
      }).then((result) => {
        if (result.deletedCount !== 0) {
          client.db().collection('users').updateMany({},
            { $pull: { likedImages: imageObjectId, postedImages: imageObjectId } },
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

  // User methods

  /**
   * Returns all users or their count for a given query
   *
   * @param query used for searching the users
   * @param page current page of content
   * @param limit number of items per page
   * @param countOnly if true, function returns just count. Default is false.
   * @returns Promise with either image array or count
   */
  async getAllUsers(query, page, limit, countOnly = false) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      if (countOnly) {
        client.db().collection('users').find(query, { _id: 1 }).count()
          .then((result) => resolve(result))
          .catch((error) => reject(error));
      } else {
        client.db().collection('users').aggregate([
          { $match: query },
          { $project: this.userAggregationProperties() }
        ]).skip(page * limit).limit(limit).toArray((error, result) => {
          if (error) {
            Logger.logError(`Error getting users: ${error}`);
            return reject(error);
          }
          resolve(this.addCreationTimestamps(result));
        });
      }
    });
  }

  /**
   * Creates a user in the database for a given User object
   *
   * @param user the user to be inserted in the database
   * @returns Promise with the write operation result
   */
  async createUser(user) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('users').insertOne(user, (error, result) => {
        if (error) {
          Logger.logError(`Error creating user: ${error}`);

          if (error.message.includes('email')) {
            return reject(new Error('User with this email already exists'));
          } else {
            return reject(new Error('User with this username already exists'));
          }
        }
        resolve(result.insertedId);
      });
    });
  }

  /**
   * Returns a Promise with user object with a given identifier. Identifiers work in the
   * following priority: userId > email > username.
   *
   * @param field field by which to search. Possible values are 'id', 'username' and 'email'
   * @param value value of the field
   * @param raw if true, the raw User object is returned. Default is false.
   * @returns Promise with User JS Object
   */
  async getUser(field, value, raw = false) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      let query = {};

      switch (field) {
      case 'id':
        query = { _id: new ObjectID(value) };
        break;
      case 'username':
        query = { username: value };
        break;
      case 'email':
        query = { email: value };
        break;
      }

      const completion = (error, result) => {
        if (error) {
          Logger.logError(`Error getting user: ${error}`);
          reject(error);
        } else if (!result) {
          reject(new Error('User not found.'));
        } else {
          result.toArray().then((res) => {
            resolve(this.addCreationTimestamp(res[0]));
          }).catch((error) => {
            Logger.logError(`Error getting user: ${error}`);
            reject(new Error('Something went wrong.'));
          });
        }
      };

      client.db().collection('users').aggregate([
        { $match: query },
        { $project: this.userAggregationProperties(raw) }
      ], completion);
    });
  }

  /**
   * Updates a user with a given id
   *
   * @param userId id of the user
   * @param userUpdates JS Object with the updated values
   * @returns Promise with empty object or error
   */
  async updateUser(userId, userUpdates) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('users').updateOne({ _id: new ObjectID(userId) }, userUpdates)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  /**
   * Deletes a user with a given id
   *
   * @param userId id of the user
   * @returns Promise with empty object or error
   */
  async deleteUser(userId) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('users').deleteOne({ _id: new ObjectID(userId) })
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }
}

module.exports = DBClient;
