import { ObjectID } from 'bson';

import { User } from './user';

export class Image {

    _id: ObjectID;
    ownerID: ObjectID;
    url: string;
    dateCreated: string;
    description: string;
    likedUsed: User[];

}
