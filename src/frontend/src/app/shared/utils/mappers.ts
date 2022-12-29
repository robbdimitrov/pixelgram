import {User, UserDto} from '../../models/user.model';
import {Image, ImageDto} from '../../models/image.model';

export function mapUser(user: UserDto): User {
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

export function mapImage(image: ImageDto): Image {
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
