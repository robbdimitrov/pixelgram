import { ObjectID } from 'mongodb';

import { DBClient } from '../data/db-client';
import { ImageFactory } from '../models/factories/image-factory';

export class ImageService {

    constructor(protected dbClient: DBClient) {}

    createImage(userId: string, url: string, description: string): Promise<any> {
        let image = ImageFactory.createImage(userId, url, description);

        return new Promise((resolve, reject) => {
            this.dbClient.createOneImage(image).then((result) => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    likeImage(imageId: string, userId: string) {
        return new Promise((resolve, reject) => {
            this.dbClient.updateOneUser(userId,
                { $addToSet: { likedImages: new ObjectID(imageId) } }
            ).then((result) => {
                this.dbClient.updateOneImage(imageId,
                    { $addToSet: { likedUsers: new ObjectID(userId) } }
                ).then((result) => {
                    resolve();
                })
            }).catch((error) => {
                reject(error);
            });
        });
    }

    unlikeImage(imageId: string, userId: string) {
        return new Promise((resolve, reject) => {
            this.dbClient.updateOneUser(userId,
                { $pull: { likedImages: new ObjectID(imageId) } }
            ).then((result) => {
                this.dbClient.updateOneImage(imageId,
                    { $pull: { likedUsers: new ObjectID(userId) } }
                ).then((result) => {
                    resolve();
                })
            }).catch((error) => {
                reject(error);
            });
        });
    }

    deleteImage(imageId: string, userId: string) {
        return new Promise((resolve, reject) => {
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

    getAllImagesForUser(userId: string, page: number, limit: number, countOnly: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbClient.getAllImages({ ownerID: new ObjectID(userId) }, page, limit, countOnly).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        })
    }

    getAllImagesLikedByUser(userId: string, page: number, limit: number, countOnly: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbClient.getOneUser(userId).then((user) => {
                this.dbClient.getAllImages({ _id: { $in: user.likedImages } }, page, limit, countOnly).then((result) => {
                    resolve(result);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    getUsersLikedImage(imageId: string, page: number, limit: number, countOnly: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbClient.getOneImage(imageId).then((image) => {
                this.dbClient.getAllUsers({ _id: { $in: image.likedUsers } }, page, limit, countOnly).then((result) => {
                    resolve(result);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

}
