import { User } from '../models/user';

export abstract class DBClient {

    constructor(protected url: string) {}

    // Images

    abstract async getAllImages(page: number, limit: number);

    // Users

    abstract async createOneUser(user: User);

    abstract async getOneUser(userID: string);

    abstract async updateOneUser(userID: string, userUpdates: Object);

    abstract async deleteOneUser(userID: string);

    // Authentication

    abstract async login(email: string, password: string);

}
