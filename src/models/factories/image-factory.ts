import * as moment from 'moment';

import { Image } from '../image';
import { ObjectID } from 'mongodb';

export class ImageFactory {

    static createImage(ownerId: string, filename: string,
        description: string): Image {

        let image = new Image();
        image.ownerId = new ObjectID(ownerId);
        image.filename = filename;
        image.description = description;
        image.dateCreated = moment().format();
        image.likedUsers = [];

        return image;
    }

}
