import { DBClient } from "../data/db-client";

import { ImageFactory } from '../models/factories/image-factory';

export class ImageService {

    constructor(protected dbClient: DBClient) {}

    likeImage(imageId: string, userId: string) {

    }

    unlikeImage(imageId: string, userId: string) {

    }

    getAllImages(page: number, limit: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbClient.getAllImages({}, page, limit).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        })
    }

    getAllImagesForUser(userId: string, page: number, limit: number) {

    }

    getAllImagesLikedByUser(userId: string, page: number, limit: number) {

    }

    numberOfUsersLikedImage(imageId: string) {

    }

    createImage(userId: string, url: string, description: string): Promise<any> {
        let image = ImageFactory.createImage(userId, url, description);

        return new Promise((resolve, reject) => {
            this.dbClient.createOneImage(image).then((result) => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }

}
