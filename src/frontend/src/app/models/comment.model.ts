export interface CommentDto {
  id: number;
  imageId: number;
  userId: number;
  username: string;
  avatar: string | null;
  body: string;
  created: string;
}

export interface CommentsDto {
  items: CommentDto[];
}

export class Comment {
  constructor(
    public id: number,
    public imageId: number,
    public userId: number,
    public username: string,
    public avatar: string | null,
    public body: string,
    public created: Date
  ) {}
}
