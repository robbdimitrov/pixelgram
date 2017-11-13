import { User } from '../models/user';
import { Image } from '../models/image';

export abstract class DBClient {

    constructor(protected url: string) {}

    // Images

    abstract async getAllImages(page: number, limit: number);

    abstract async createOneImage(image: Image);

    abstract async getOneImage(imageId: string);

    abstract async updateOneImage(userId: string, imageId: string, imageUpdates: Object);

    abstract async deleteOneImage(userId: string, imageId: string);

    // Users

    abstract async createOneUser(user: User);

    // Use raw = true to get the User object with password and ObjectID identifier
    abstract async getOneUser(userId?: string, email?: string, username?: string, raw?: boolean);

    abstract async updateOneUser(userId: string, userUpdates: Object);

    abstract async deleteOneUser(userId: string);

}
