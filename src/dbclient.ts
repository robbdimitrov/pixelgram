import { Db, MongoClient } from 'mongodb';
import * as callback from './callbacks';

export type DatabaseCallback = (database: Db) => void;

export class DBClient {

    private database: Db | undefined;

    constructor(private url: string) {}

    private establishConnection(url: string): Promise<Db> {
        return new Promise((resolve,reject) => {
            if (this.database) {
                resolve(this.database);
            }

            MongoClient.connect(url, (err, db) => {
                if (err) return reject(err);

                this.database = db;
                resolve(this.database);
            });
        });
    }

    async get() {
        return await this.establishConnection(this.url);
    }

    private close(completion: callback.CompletionHandler, failure: callback.ErrorHandler) {
        if (this.database) {
            this.database.close((err, result) => {
                this.database = undefined;

                if (err) {
                    failure(err);
                } else {
                    completion();
                }
            });
        }
    }

}
