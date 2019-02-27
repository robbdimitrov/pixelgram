import { ObjectID } from 'mongodb';

export class Image {

    _id: ObjectID;
    ownerId: ObjectID;
    filename: string;
    dateCreated: string;
    description: string;
    likedUsers: ObjectID[];

}
