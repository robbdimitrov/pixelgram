const ObjectID = require('mongodb').ObjectID;

const ImageFactory = require('./image-factory');

class ImageService {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createImage(userId, filename, description) {
    const image = ImageFactory.createImage(new ObjectID(userId),
      filename, description);

    return new Promise((resolve, reject) => {
      this.dbClient.createOneImage(image).then((result) => {
        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  likeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      this.dbClient.updateOneUser(userId,
        { $addToSet: { likedImages: new ObjectID(imageId) } },
      ).then(() => {
        this.dbClient.updateOneImage(imageId,
          { $addToSet: { likedUsers: new ObjectID(userId) } },
        ).then(() => {
          resolve();
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }

  unlikeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      this.dbClient.updateOneUser(userId,
        { $pull: { likedImages: new ObjectID(imageId) } },
      ).then(() => {
        this.dbClient.updateOneImage(imageId,
          { $pull: { likedUsers: new ObjectID(userId) } },
        ).then(() => {
          resolve();
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }

  deleteImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      this.dbClient.deleteOneImage(userId, imageId).then(() => {
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getAllImages(page, limit, userId) {
    return new Promise((resolve, reject) => {
      this.dbClient.getAllImages({}, page, limit, false, userId).then((result) => {
        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getAllImagesForUser(ownerId, page, limit, countOnly = false, userId) {
    return new Promise((resolve, reject) => {
      const query = { ownerId: new ObjectID(ownerId) };

      this.dbClient.getAllImages(query, page, limit, countOnly, userId).then((result) => {
        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getAllImagesLikedByUser(userId, page, limit, countOnly = false, currentUserId) {
    return new Promise((resolve, reject) => {
      const query = { likedUsers: new ObjectID(userId) };

      this.dbClient.getAllImages(query, page, limit, countOnly, currentUserId).then((result) => {
        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getUsersLikedImage(imageId, page, limit, countOnly = false) {
    return new Promise((resolve, reject) => {
      const query = { likedImages: new ObjectID(imageId) };

      this.dbClient.getAllUsers(query, page, limit, countOnly).then((result) => {
        resolve(result);
      }).catch((error) => {
        reject(error);
      });
    });
  }
}

module.exports = ImageService;
