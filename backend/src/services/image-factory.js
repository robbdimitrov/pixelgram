const Image = require('../models/image');

class ImageFactory {
  static createImage(ownerId, filename, description) {
    const image = new Image();
    image.ownerId = ownerId;
    image.filename = filename;
    image.dateCreated = new Date().toISOString();
    image.description = description;
    return image;
  }
}

module.exports = ImageFactory;
