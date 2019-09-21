const ObjectID = require('mongodb');
const Image = require('../models/image');

class ImageFactory {
  static createImage(ownerId, filename, description) {
    const image = new Image(
      undefined,
      new ObjectID(ownerId),
      filename,
      new Date().toISOString(),
      description,
      []
    );
    return image;
  }
}

module.exports = ImageFactory;
