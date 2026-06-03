
import { ImageDto, ImageRow, SessionDto, SessionRow, UserDto, UserRow } from '../types';

function mapUser(user: UserRow): UserDto {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    images: +user.images,
    likes: +user.likes,
    created: user.created
  };
}

function mapSession(session: SessionRow): SessionDto {
  return {
    id: session.id,
    userId: session.user_id,
    created: session.created,
    expiresAt: session.expires_at
  };
}

function mapImage(image: ImageRow): ImageDto {
  return {
    id: image.id,
    userId: image.user_id,
    filename: image.filename,
    description: image.description,
    likes: +image.likes,
    liked: image.liked,
    created: image.created
  };
}

export {
  mapUser,
  mapSession,
  mapImage
};
