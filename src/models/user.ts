import { Image } from './image';
import { Session } from './session';

export class User {

    name: string;
    username: string;
    email: string;
    password: string;
    bio: string;
    avatar: string;
    likedImages: Image[];
    postedImages: Image[];
    registrationDate: Date;
    lastLoginDate: Date;
    sessions: Session[];

}
