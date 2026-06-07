export interface PostIdDto {
  id: number;
}

export interface PostDto {
  id: number;
  userId: number;
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
    public filename: string,
    public description: string,
    public likes: number,
    public liked: boolean,
    public comments: number,
    public created: Date
  ) {}
}
