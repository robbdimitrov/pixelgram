export abstract class DBClient {

    constructor(protected url: string) {}

    abstract async getAllImages(page: number, limit: number);

}
