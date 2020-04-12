import { User } from '../../models/user.model';
import { Image } from '../../models/image.model';

export function mapUser(object: any) {
  return new User(
    object.id,
    object.name,
    object.username,
    object.email,
    object.avatar,
    object.bio,
    object.images,
    object.likes,
    new Date(object.created)
  );
}

export function mapImage(object: any) {
  return new Image(
    object.id,
    object.userId,
    object.filename,
    object.description,
    object.likes,
    object.liked,
    new Date(object.created)
  );
}
