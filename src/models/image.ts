import { User } from './user';

export class Image {

    owner: User;
    url: string;
    uploadDate: Date;
    description: string;
    likedUsed: User[];

}
