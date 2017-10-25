import { ObjectID, Db, MongoClient }      from 'mongodb';
import { DBClient }                       from './db-client';

export type DatabaseCallback = (database: Db) => void;

export class DBWorker extends DBClient {

    private database: Db | undefined;

    // Database connection methods

    private establishConnection(url: string): Promise<Db> {
        return new Promise((resolve,reject) => {
            if (this.database) {
                return resolve(this.database);
            }

            MongoClient.connect(url, (err, db) => {
                if (err) return reject(err);

                console.log('connected to database');
                this.database = db;
                resolve(this.database);
            });
        });
    }

    private async get() {
        return await this.establishConnection(this.url);
    }

    private closeConnection(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.database) {
                return resolve(this.database);
            }

            this.database.close((err, result) => {
                this.database = undefined;

                if (err) {
                    return reject(err);
                }

                resolve(this.database);
            });
        });
    }

    // Image methods

    async getAllImages(page: number, limit: number) {
        let db = await this.get();
        return new Promise((resolve, reject) => {
            db.collection('images').find({}).skip(page * limit).limit(limit).toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve(result);
            });
        });
    }

}
