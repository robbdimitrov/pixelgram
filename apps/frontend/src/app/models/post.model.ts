export interface PostIdDto {
  id: number;
}

export interface PostDto {
  id: number;
  userId: number;
  username: string;
  name: string;
  avatar: string | null;
  filename: string;
  description: string;
  likes: number;
  liked: boolean;
  comments: number;
  created: string;
}

export interface PostsDto {
  items: PostDto[];
}

export interface ImageFilenameDto {
  filename: string;
}

export class Post {
  constructor(
    public id: number,
    public userId: number,
    public username: string,
    public name: string,
    public avatar: string | null,
    public filename: string,
    public description: string,
    public likes: number,
    public liked: boolean,
    public comments: number,
    public created: Date
  ) {}
}
