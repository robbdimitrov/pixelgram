import { User } from '../models/user';

export abstract class DBClient {

    constructor(protected url: string) {}

    abstract async getAllImages(page: number, limit: number);

    abstract async createOneUser(user: User);

    abstract async login(email: string, password: string);

}
