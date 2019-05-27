import { ObjectID } from 'mongodb';
import { Image } from '../models/image';

export class ImageFactory {
  static createImage(ownerId, filename, description) {
    let image = new Image(
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
