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

    abstract async getOneUser(userID: string);

    abstract async updateOneUser(userID: string, userUpdates: Object);

    abstract async deleteOneUser(userID: string);

    // Authentication

    abstract async login(email: string, password: string);

}
