import * as moment from 'moment';

import { Image } from '../image';
import { ObjectID } from 'mongodb';

export class ImageFactory {

    static createImage(ownerID: string, url: string,
        description: string): Image {

        let image = new Image();
        image.ownerID = new ObjectID(ownerID);
        image.url = url;
        image.description = description;
        image.dateCreated = moment().format();
        image.likedUsers = [];

        return image;
    }

}
