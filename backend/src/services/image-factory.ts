import * as moment from 'moment';

import { ObjectID } from 'mongodb';
import { Image } from '../models/image';

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
