class ImageFactory {
  static createImage(ownerId, filename, description) {
    const image = {
      ownerId: ownerId,
      filename: filename,
      dateCreated: new Date().toISOString(),
      description: description
    };
    return image;
  }
}

module.exports = ImageFactory;
