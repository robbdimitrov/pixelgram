import {User, UserDto} from '../../models/user.model';
import {Post, PostDto} from '../../models/post.model';

export function mapUser(user: UserDto): User {
  return new User(
    user.id,
    user.name,
    user.username,
    user.email,
    user.avatar,
    user.bio,
    user.posts,
    user.likes,
    new Date(user.created)
  );
}

export function mapPost(post: PostDto): Post {
  return new Post(
    post.id,
    post.userId,
    post.filename,
    post.description,
    post.likes,
    post.liked,
    post.comments ?? 0,
    new Date(post.created)
  );
}
