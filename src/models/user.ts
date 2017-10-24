import { Image } from './image';

export class User {

    name: string;
    username: string;
    email: string;
    bio: string;
    avatar: string;
    likedImages: Image[];
    postedImages: Image[];
    password: string;
    registrationDate: Date;
    lastLoginDate: Date;

}
