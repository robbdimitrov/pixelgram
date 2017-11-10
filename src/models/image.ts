import { User } from './user';

export class Image {

    owner: User;
    url: string;
    dateCreated: Date;
    description: string;
    likedUsed: User[];

}
