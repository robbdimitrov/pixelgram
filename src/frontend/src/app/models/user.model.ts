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
  created: string;
}

export class User {
  constructor(
    public id: number,
    public name: string,
    public username: string,
    public email: string,
    public avatar: string | null,
    public bio: string | null,
    public posts: number,
    public likes: number,
    public created: Date
  ) {}
}
