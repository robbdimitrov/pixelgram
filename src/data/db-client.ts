import { User } from '../models/user';
import { Image } from '../models/image';

export abstract class DBClient {

    constructor(protected url: string) {}

    // Images

    abstract async getAllImages(page: number, limit: number);

    abstract async createOneImage(image: Image);

    abstract async getOneImage(imageID: string);

    abstract async updateOneImage(userID: string, imageID: string, imageUpdates: Object);

    abstract async deleteOneImage(userID: string, imageID: string);

    // Users

    abstract async createOneUser(user: User);

    // Use raw = true to get the User object with password and ObjectID identifier
    abstract async getOneUser(userID?: string, email?: string, username?: string, raw?: boolean);

    abstract async updateOneUser(userID: string, userUpdates: Object);

    abstract async deleteOneUser(userID: string);

}
