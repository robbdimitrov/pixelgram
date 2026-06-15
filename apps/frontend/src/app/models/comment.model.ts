export interface CommentDto {
  id: number;
  postId: number;
  userId: number;
  username: string;
  avatar: string | null;
  body: string;
  created: string;
}

export class Comment {
  constructor(
    public id: number,
    public postId: number,
    public userId: number,
    public username: string,
    public avatar: string | null,
    public body: string,
    public created: Date
  ) {}
}
