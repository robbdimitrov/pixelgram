import type { User, UserDto, Post, PostDto, Comment, CommentDto } from '$lib/types';

export function mapUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    username: dto.username,
    email: dto.email,
    avatar: dto.avatar,
    bio: dto.bio,
    posts: dto.posts,
    likes: dto.likes,
    followers: dto.followers ?? 0,
    following: dto.following ?? 0,
    isFollowing: dto.isFollowing ?? false,
    created: new Date(dto.created)
  };
}

export function mapPost(dto: PostDto): Post {
  return {
    id: dto.id,
    publicId: dto.publicId,
    userId: dto.userId,
    username: dto.username,
    name: dto.name,
    avatar: dto.avatar,
    filename: dto.filename,
    description: dto.description,
    likes: dto.likes,
    liked: dto.liked,
    comments: dto.comments ?? 0,
    created: new Date(dto.created)
  };
}

export function mapComment(dto: CommentDto): Comment {
  return {
    id: dto.id,
    postId: dto.postId,
    userId: dto.userId,
    username: dto.username,
    avatar: dto.avatar,
    body: dto.body,
    created: new Date(dto.created)
  };
}
