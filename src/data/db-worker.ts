import { ObjectID, Db, MongoClient } from 'mongodb';

import { DBClient, UserSearchField } from './db-client';
import { User } from '../models/user';
import { Image } from '../models/image';
import { UserFactory } from '../services/user-factory';
import { ImageFactory } from '../services/image-factory';
import * as config from '../../config/server.config';
import { error } from 'util';

export type DatabaseCallback = (database: Db) => void;

export class DBWorker extends DBClient {

    private database?: Db;

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

    // Aggregation

    userAggregationProperties(raw: boolean = false): Object {
        let properties = {
            name: 1,
            username: 1,
            email: 1,
            bio: 1,
            avatar: 1,
            registrationDate: 1,
            likes: { $size: '$likedImages' },
            images: { $size: '$postedImages' }
        };

        if (raw) {
            properties['password'] = 1
        }

        return properties;
    }

    imageAggregationProperties(userId?: string): Object {
        let properties = {
            ownerId: 1,
            filename: 1,
            dateCreated: 1,
            description: 1,
            likes: { $size: '$likedUsers' }
        };

        if (userId !== undefined) {
            properties['isLiked'] = { $in: [ new ObjectID(userId), '$likedUsers' ] }
        }

        return properties;
    }

    // Image methods

    async imageIsOwnedByUser(userId: string, imageId: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('images').find({
                _id: new ObjectID(imageId),
                ownerId: new ObjectID(userId)
            },
            {
                id: 1, ownerId: 1
            }).count((error, result) =>{
                if (result > 0) {
                    return resolve();
                }
                return reject(new Error('Image not existing or owned by other user.'));
            });
        });
    }

    async getAllImages(query: Object, page: number, limit: number,
        countOnly: boolean = false, userId?: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            if (countOnly) {
                db.collection('images').find(query, { _id: 1 }).count().then((res) => {
                    return resolve(res);
                }).catch((error) => {
                    reject(error);
                });
            } else {
                let sortQuery = { dateCreated: -1 };

                db.collection('images').aggregate([
                    { $match: query },
                    { $project: this.imageAggregationProperties(userId) }
                ]).sort(sortQuery).skip(page * limit).limit(limit).toArray((err, result) => {
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
                    { _id: image.ownerId },
                    { $push: { postedImages: result.insertedId } }
                ).then((result) => {
                    resolve(result);
                }).catch((error) => {
                    return reject(error);
                });
            });
        });
    }

    async getOneImage(imageId: string, userId?: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            let query = { _id: new ObjectID(imageId) };

            db.collection('images').aggregate([
                { $match: query },
                { $project: this.imageAggregationProperties(userId) }
            ], (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result[0]);
            })
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
                    db.collection('images').deleteOne({ _id: new ObjectID(imageId) }, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve();
                    });
                });
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    // User methods

    async getAllUsers(query: Object, page: number, limit: number, countOnly: boolean = false) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            if (countOnly) {
                db.collection('users').find(query, { _id: 1 }).count().then((res) => {
                    return resolve(res);
                }).catch((error) => {
                    reject(error);
                });
            } else {
                db.collection('users').aggregate([
                    { $match: query },
                    { $project: this.userAggregationProperties() }
                ]).skip(page * limit).limit(limit).toArray((err, result) => {
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
            db.collection('users').aggregate([
                { $match: { $or: [{ email: email }, { username: username }] } },
                { $project: { _id: 1 } }
            ]).toArray((err, result) => {
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
                db.collection('users').insertOne(user, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    async getOneUser(field: UserSearchField, value: string, raw: boolean = false) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            let query: Object = {};

            switch (field) {
                case UserSearchField.Identifier:
                    query = { "_id": new ObjectID(value) };
                    break;
                case UserSearchField.Username:
                    query = { username: value };
                    break;
                case UserSearchField.Email:
                    query = { email: value };
                    break;
            }

            let completion = (error, result) => {
                if (error) {
                    return reject(error);
                } else if (!result) {
                    let error = new Error('User not found.');
                    return reject(error);
                }
                return resolve(result[0]);
            };

            db.collection('users').aggregate([
                { $match: query },
                { $project: this.userAggregationProperties(raw) }
            ], completion)
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
