import { ObjectID } from 'mongodb';

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
