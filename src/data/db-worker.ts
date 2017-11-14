import { ObjectID, Db, MongoClient } from 'mongodb';

import { DBClient } from './db-client';
import { User } from '../models/user';
import { Image } from '../models/image';
import { UserFactory } from '../models/factories/user-factory';
import { ImageFactory } from '../models/factories/image-factory';
import * as config from '../../config/server.config';
import { error } from 'util';

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

                console.log('Connected to database');
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

    async imageIsOwnedByUser(userId: string, imageId: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('images').find({
                _id: new ObjectID(imageId),
                ownerID: new ObjectID(userId)
            }).toArray((err, result) => {
                if (result.length > 0) {
                    return resolve();
                }
                return reject(new Error('Image not existing or owned by other user.'));
            });
        });
    }

    async getAllImages(query: Object, page: number, limit: number, countOnly: boolean = false) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            let cursor = db.collection('images').find(query);

            if (countOnly) {
                cursor.count().then((res) => {
                    return resolve(res);
                }).catch((error) => {
                    reject(error);
                });
            } else {
                cursor.skip(page * limit).limit(limit).toArray((err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            }
        });
    }

    async createOneImage(image: Image) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('images').insertOne(image, (err, result) => {
                if (err) {
                    return reject(err);
                }

                db.collection('users').updateOne(
                    { _id: image.ownerID },
                    { $push: { postedImages: result.insertedId } }
                ).then((result) => {
                    resolve(result);
                }).catch((error) => {
                    return reject(error);
                });
            });
        });
    }

    async getOneImage(imageId: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('images').findOne({ _id: new ObjectID(imageId) }, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }

    async updateOneImage(imageId: string, imageUpdates: Object) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('images').updateOne({ _id: new ObjectID(imageId) }, imageUpdates, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async deleteOneImage(userId: string, imageId: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            this.imageIsOwnedByUser(userId, imageId).then(() => {
                let imageObjectId = new ObjectID(imageId);

                db.collection('users').update({},
                    { $pull: { likedImages: imageObjectId, postedImages: imageObjectId } },
                    { multi: true }
                ).then((result) => {
                    db.collection('images').deleteOne({ _id: new ObjectID(imageId) }, (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                }).catch((error) => {
                    return reject(error);
                });
            }).catch((err) => {
                return reject(err);
            });
        });
    }

    // User methods

    async getAllUsers(query: Object, page: number, limit: number, countOnly: boolean = false) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            let cursor = db.collection('users').find(query, { fields: { password: 0 } });

            if (countOnly) {
                cursor.count().then((res) => {
                    return resolve(res);
                }).catch((error) => {
                    reject(error);
                });
            } else {
                cursor.skip(page * limit).limit(limit).toArray((err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            }
        });
    }

    async userNotExists(username: string, email: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('users').find({
                $or: [{ email: email }, { username: username }]
            }).toArray((err, result) => {
                if (result.length > 0) {
                    let firstUser = result[0];
                    if (firstUser.email === email) {
                        return reject(new Error('User with this email already exists'));
                    } else if (firstUser.username === username) {
                        return reject(new Error('User with this username already exists'));
                    }
                }
                resolve();
            });
        });
    }

    async createOneUser(user: User) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            this.userNotExists(user.username, user.email).then(() => {
                db.collection('users').insertOne(user, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            }).catch((err) => {
                return reject(err);
            });
        });
    }

    async getOneUser(userId?: string, email?: string, username?: string, raw: boolean = false) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            let query: Object;

            if (userId) {
                query = { _id: new ObjectID(userId) };
            } else if (email) {
                query = { email: email };
            } else if (username) {
                query = { username: username };
            } else {
                let err = new Error('Missing user identifier. Either of userId, email or username should be present.');
                return reject(err);
            }

            let completion = (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            };

            if (raw) {
                db.collection('users').findOne(query, completion);
            } else {
                db.collection('users').findOne(query, { fields: { password: 0 } }, completion);
            }
        });
    }

    async updateOneUser(userId: string, userUpdates: Object) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('users').updateOne({ _id: new ObjectID(userId) }, userUpdates, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async deleteOneUser(userId: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('users').deleteOne({ _id: new ObjectID(userId) }, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

}
