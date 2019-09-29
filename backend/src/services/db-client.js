const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

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
        return reject(error);
      });
    });
  }

  async get() {
    return await this.establishConnection(this.url);
  }

  closeConnection() {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        return resolve(this.client);
      }

      this.client.close((err) => {
        this.client = undefined;

        if (err) {
          return reject(err);
        }
        resolve(this.client);
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
      registrationDate: 1,
      likes: { $size: '$likedImages' },
      images: { $size: '$postedImages' },
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
      dateCreated: 1,
      description: 1,
      likes: { $size: '$likedUsers' },
    };

    if (userId !== undefined) {
      properties['isLiked'] = { $in: [ new ObjectID(userId), '$likedUsers' ] };
    }

    return properties;
  }

  // Image methods

  /**
   * Returns a promise if the image with imageId is owned by the user with userId.
   *
   * @param userId if of the user
   * @param imageId id of the image
   * @returns Promise with empty result or error
   */
  async imageIsOwnedByUser(userId, imageId) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('images').find({
        _id: new ObjectID(imageId),
        ownerId: new ObjectID(userId),
      }, { ownerId: 1 }).count((error, result) => {
        if (result > 0) {
          return resolve();
        }
        return reject(new Error('Image not existing or owned by other user.'));
      });
    });
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
        client.db().collection('images').find(query, { _id: 1 }).count().then((res) => {
          return resolve(res);
        }).catch((error) => {
          reject(error);
        });
      } else {
        const sortQuery = { dateCreated: -1 };

        client.db().collection('images').aggregate([
          { $match: query },
          { $project: this.imageAggregationProperties(userId) },
        ]).sort(sortQuery).skip(page * limit).limit(limit).toArray((err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
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
  async createOneImage(image) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('images').insertOne(image, (err, result) => {
        if (err) {
          return reject(err);
        }

        client.db().collection('users').updateOne(
          { _id: image.ownerId },
          { $push: { postedImages: result.insertedId } },
        ).then((result) => {
          resolve(result);
        }).catch((error) => {
          return reject(error);
        });
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
  async getOneImage(imageId, userId) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      const query = { _id: new ObjectID(imageId) };

      client.db().collection('images').aggregate([
        { $match: query },
        { $project: this.imageAggregationProperties(userId) },
      ], (error, result) => {
        if (error) {
          return reject(error);
        }
        result.toArray().then((res) => {
          resolve(res[0]);
        }).catch(() => {
          reject('Something went wrong.');
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
  async updateOneImage(imageId, imageUpdates) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('images').updateOne({ _id: new ObjectID(imageId) }, imageUpdates, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Deletes an image with a given id
   *
   * @param userId id of the owner
   * @param imageId id of the image
   * @returns Promise with empty object or error
   */
  async deleteOneImage(userId, imageId) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      this.imageIsOwnedByUser(userId, imageId).then(() => {
        const imageObjectId = new ObjectID(imageId);

        client.db().collection('users').updateMany({},
          { $pull: { likedImages: imageObjectId, postedImages: imageObjectId } },
          { multi: true },
        ).then(() => {
          client.db().collection('images').deleteOne({ _id: new ObjectID(imageId) }, (error) => {
            if (error) {
              return reject(error);
            }
            resolve();
          });
        });
      }).catch((error) => {
        return reject(error);
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
        client.db().collection('users').find(query, { _id: 1 }).count().then((res) => {
          return resolve(res);
        }).catch((error) => {
          reject(error);
        });
      } else {
        client.db().collection('users').aggregate([
          { $match: query },
          { $project: this.userAggregationProperties() },
        ]).skip(page * limit).limit(limit).toArray((err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        });
      }
    });
  }

  async userNotExists(username, email) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('users').aggregate([
        { $match: { $or: [{ email }, { username }] } },
        { $project: { _id: 1, username: 1, email: 1 } },
      ]).toArray((err, result) => {
        if (result.length > 0) {
          const firstUser = result[0];
          if (firstUser.email === email) {
            return reject(new Error('User with this email already exists'));
          } else if (firstUser.username === username) {
            return reject(new Error('User with this username already exists'));
          }
        }
        resolve();
      });
    });
  }

  /**
   * Creates a user in the database for a given User object
   *
   * @param user the user to be inserted in the database
   * @returns Promise with the write operation result
   */
  async createOneUser(user) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      this.userNotExists(user.username, user.email).then(() => {
        client.db().collection('users').insertOne(user, (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        });
      }).catch((error) => {
        return reject(error);
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
  async getOneUser(field, value, raw = false) {
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
          reject(error);
        } else if (!result) {
          const error = new Error('User not found.');
          reject(error);
        } else {
          result.toArray().then((res) => {
            resolve(res[0]);
          }).catch(() => {
            reject('Something went wrong.');
          });
        }
      };

      client.db().collection('users').aggregate([
        { $match: query },
        { $project: this.userAggregationProperties(raw) },
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
  async updateOneUser(userId, userUpdates) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('users').updateOne({ _id: new ObjectID(userId) }, userUpdates, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Deletes a user with a given id
   *
   * @param userId id of the user
   * @returns Promise with empty object or error
   */
  async deleteOneUser(userId) {
    const client = await this.get();

    return new Promise((resolve, reject) => {
      client.db().collection('users').deleteOne({ _id: new ObjectID(userId) }, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}

module.exports = DBClient;
