import { ObjectID } from 'bson';

import { Image } from './image';

export class User {

    _id: ObjectID;
    name: string;
    username: string;
    email: string;
    password: string;
    bio: string;
    avatar: string;
    likedImages: Image[];
    postedImages: Image[];
    registrationDate: string;
    lastLoginDate: string;

}
