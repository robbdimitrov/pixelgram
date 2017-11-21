import { ObjectID } from 'mongodb';

import { DBClient, UserSearchField } from '../data/db-client';
import { ImageFactory } from '../services/image-factory';

export class ImageService {

    constructor(protected dbClient: DBClient) {}

    createImage(userId: string, filename: string, description: string): Promise<any> {
        let image = ImageFactory.createImage(userId, filename, description);

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

    getAllImages(page: number, limit: number, userId?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.dbClient.getAllImages({}, page, limit, false, userId).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    getAllImagesForUser(ownerId: string, page: number, limit: number, countOnly: boolean = false, userId?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let query = { ownerId: new ObjectID(ownerId) };

            this.dbClient.getAllImages(query, page, limit, countOnly, userId).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    getAllImagesLikedByUser(userId: string, page: number, limit: number,
        countOnly: boolean = false, currentUserId?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let query = { likedUsers: new ObjectID(userId) };

            this.dbClient.getAllImages(query, page, limit, countOnly, currentUserId).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    getUsersLikedImage(imageId: string, page: number, limit: number, countOnly: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            let query = { likedImages: new ObjectID(imageId) };

            this.dbClient.getAllUsers(query, page, limit, countOnly).then((result) => {
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        });
    }

}
