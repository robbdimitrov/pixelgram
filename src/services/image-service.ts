import { DBClient } from '../data/db-client';

import { ImageFactory } from '../models/factories/image-factory';
import { ObjectID } from 'mongodb';
import { error } from 'util';

export class ImageService {

    constructor(protected dbClient: DBClient) {}

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

    likeImage(imageId: string, userId: string) {

    }

    unlikeImage(imageId: string, userId: string) {

    }

    deleteImage(imageId: string, userId: string) {
        return new Promise((resolve, reject) => {
            //TODO: Remove image from owner's images array
            //TODO: Remove image from liked users' likedImages

            this.dbClient.deleteOneImage(userId, imageId).then((result) => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
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

    getAllImagesForUser(userId: string, page: number, limit: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbClient.getAllImages({ ownerID: new ObjectID(userId) }, page, limit).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        })
    }

    getAllImagesLikedByUser(userId: string, page: number, limit: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbClient.getOneUser(userId).then((user) => {
                this.dbClient.getAllImages({ _id: { $in: user.likedImages } }, page, limit).then((result) => {
                    resolve(result);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    usersLikedImage(imageId: string, page: number, limit: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbClient.getOneImage(imageId).then((image) => {
                this.dbClient.getAllImages({ _id: { $in: image.likedUsed } }, page, limit).then((result) => {
                    resolve(result);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    numberOfUsersLikedImage(imageId: string, page: number, limit: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.dbClient.getOneImage(imageId).then((image) => {
                this.dbClient.getAllImages({ _id: { $in: image.likedUsed } }, page, limit, true).then((result) => {
                    resolve(result);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

}
