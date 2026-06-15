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
    public followers: number,
    public following: number,
    public isFollowing: boolean,
    public created: Date
  ) {}
}
