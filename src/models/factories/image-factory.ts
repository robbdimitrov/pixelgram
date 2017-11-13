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

        return image;
    }

    // Creates a JSON user by stripping passwords and
    // replacing ObjectID with string representation
    static createJsonImage(image: Image): Object {
        let jsonImage = new Object();

        jsonImage['id'] = image._id.toString();
        jsonImage['ownerID'] = image.ownerID.toHexString();
        jsonImage['url'] = image.url;
        jsonImage['description'] = image.description;
        jsonImage['dateCreated'] = image.dateCreated;

        return jsonImage;
    }

}
