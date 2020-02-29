class ImageService {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createImage(userId, filename, description) {
    const image = { userId, filename, description };

    return new Promise((resolve, reject) => {
      this.dbClient.createImage(image)
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }

  likeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      this.dbClient.updateUser(userId,
        { $addToSet: { likedImages: imageId } }
      ).then(() => {
        this.dbClient.updateImage(imageId,
          { $addToSet: { likedUsers: userId } }
        ).then(() => resolve());
      }).catch((error) => {
        reject(error);
      });
    });
  }

  unlikeImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      this.dbClient.updateUser(userId,
        { $pull: { likedImages: imageId } }
      ).then(() => {
        this.dbClient.updateImage(imageId,
          { $pull: { likedUsers: userId } }
        ).then(() => resolve());
      }).catch((error) => {
        reject(error);
      });
    });
  }

  deleteImage(imageId, userId) {
    return new Promise((resolve, reject) => {
      this.dbClient.deleteImage(imageId, userId)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  getAllImages(page, limit, userId) {
    return new Promise((resolve, reject) => {
      this.dbClient.getAllImages({}, page, limit, userId)
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }

  getAllImagesForUser(ownerId, page, limit, userId) {
    return new Promise((resolve, reject) => {
      const query = { ownerId: ownerId };

      this.dbClient.getAllImages(query, page, limit, userId)
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }

  getAllImagesLikedByUser(userId, page, limit, currentUserId) {
    return new Promise((resolve, reject) => {
      const query = { likedUsers: userId };

      this.dbClient.getAllImages(query, page, limit, currentUserId)
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }

  getUsersLikedImage(imageId, page, limit) {
    return new Promise((resolve, reject) => {
      const query = { likedImages: imageId };

      this.dbClient.getAllUsers(query, page, limit)
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }
}

module.exports = ImageService;
