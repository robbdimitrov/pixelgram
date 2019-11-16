import { Image } from '../models/image.model';

export class ImageFactory {
  static imageFromObject(object: any): Image {
    const image = new Image(
      object._id,
      object.ownerId,
      object.filename,
      object.description,
      object.likes,
      object.isLiked,
      new Date(object.createdAt)
    );
    return image;
  }
}
