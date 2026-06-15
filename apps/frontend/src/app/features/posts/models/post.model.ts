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

export class Post {
  constructor(
    public id: number,
    public publicId: string,
    public userId: number,
    public username: string,
    public name: string,
    public avatar: string | null,
    public filename: string,
    public description: string | null,
    public likes: number,
    public liked: boolean,
    public comments: number,
    public created: Date
  ) {}
}
