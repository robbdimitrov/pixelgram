import { ObjectID } from 'mongodb';

import { User } from './user';

export class Image {

    _id: ObjectID;
    ownerID: ObjectID;
    url: string;
    dateCreated: string;
    description: string;
    likedUsers: ObjectID[];

}
