import { User } from '../../models/user.model';
import { Image } from '../../models/image.model';

export function mapUser(user: any) {
  return new User(
    user.id,
    user.name,
    user.username,
    user.email,
    user.avatar,
    user.bio,
    user.images,
    user.likes,
    new Date(user.created)
  );
}

export function mapImage(image: any) {
  return new Image(
    image.id,
    image.userId,
    image.filename,
    image.description,
    image.likes,
    image.liked,
    new Date(image.created)
  );
}
