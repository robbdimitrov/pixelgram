import { ObjectID } from "mongodb";
import { Image } from "../models/image";

export class ImageFactory {
  static createImage(ownerId, filename, description) {
    let image = new Image();
    image.ownerId = new ObjectID(ownerId);
    image.filename = filename;
    image.description = description;
    image.dateCreated = new Date().toISOString();
    image.likedUsers = [];

    return image;
  }
}
