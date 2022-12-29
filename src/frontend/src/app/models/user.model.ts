export interface UserDto {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  images: number;
  likes: number;
  created: string;
}

export class User {
  constructor(
    public id: number,
    public name: string,
    public username: string,
    public email: string,
    public avatar: string,
    public bio: string,
    public images: number,
    public likes: number,
    public created: Date
  ) {}
}
