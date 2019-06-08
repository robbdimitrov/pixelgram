import { ObjectID } from 'mongodb';
import { Image } from '../models/image';

export class ImageFactory {
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
