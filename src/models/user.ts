import { ObjectID } from 'mongodb';

import { Image } from './image';

export class User {

    _id: ObjectID;
    name: string;
    username: string;
    email: string;
    password: string;
    bio: string;
    avatar: string;
    likedImages: ObjectID[];
    postedImages: ObjectID[];
    registrationDate: string;

}
