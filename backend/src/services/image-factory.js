class ImageFactory {
  static createImage(ownerId, filename, description) {
    const image = {
      ownerId: ownerId,
      filename: filename,
      description: description,
      likedUsers: []
    };
    return image;
  }
}

module.exports = ImageFactory;
