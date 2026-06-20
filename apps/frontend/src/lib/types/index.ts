export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface UserIdDto {
  id: number;
}

export interface UserDto {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  posts: number;
  likes: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  created: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  posts: number;
  likes: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  created: Date;
}

export interface PostIdDto {
  publicId: string;
}

export interface PostDto {
  id: number;
  publicId: string;
  userId: number;
  username: string;
  name: string;
  avatar: string | null;
  filename: string;
  description: string | null;
  likes: number;
  liked: boolean;
  comments: number;
  created: string;
}

export interface ImageFilenameDto {
  filename: string;
}

export interface Post {
  id: number;
  publicId: string;
  userId: number;
  username: string;
  name: string;
  avatar: string | null;
  filename: string;
  description: string | null;
  likes: number;
  liked: boolean;
  comments: number;
  created: Date;
}

export interface CommentDto {
  id: number;
  postId: number;
  userId: number;
  username: string;
  avatar: string | null;
  body: string;
  created: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  username: string;
  avatar: string | null;
  body: string;
  created: Date;
}
