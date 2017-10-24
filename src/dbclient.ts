import { Db, MongoClient } from 'mongodb';
import * as callback from './callbacks';

export class DBClient {

    database: Db;

    connect(url: string, completion: callback.CompletionHandler,
        failure: callback.ErrorHandler) {

        if (this.database) return completion();

        MongoClient.connect(url, function(err, db) {
            if (err) return failure(err);

            this.database = db;
            completion();
        });
    }

    get() {
        return this.database;
    }

    close(completion: callback.CompletionHandler, failure: callback.ErrorHandler) {
        if (this.database) {
            this.database.close(function(err, result) {
                this.database = undefined;
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
