import { ObjectID } from 'bson';

import { User } from './user';

export class Image {

    _id: ObjectID;
    owner: User;
    url: string;
    dateCreated: Date;
    description: string;
    likedUsed: User[];

}
