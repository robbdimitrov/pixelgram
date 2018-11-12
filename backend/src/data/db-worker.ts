import { Db, MongoClient, ObjectID } from 'mongodb';

import { error } from 'util';
import * as config from '../../config/server.config';
import { Image } from '../models/image';
import { User } from '../models/user';
import { ImageFactory } from '../services/image-factory';
import { UserFactory } from '../services/user-factory';
import { DBClient, UserSearchField } from './db-client';

export type DatabaseCallback = (database: Db) => void;

export class DBWorker extends DBClient {

    private client?: MongoClient;

    // Database connection methods

    private establishConnection(url: string): Promise<MongoClient> {
        return new Promise((resolve, reject) => {
            if (this.client) {
                return resolve(this.client);
            }

            MongoClient.connect(url, { useNewUrlParser: true }).then((result) => {
                console.log('Connected to database');
                this.client = result;
                resolve(this.client);
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    private async get() {
        return await this.establishConnection(this.url);
    }

    private closeConnection(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return resolve(this.client);
            }

            this.client.close((err, result) => {
                this.client = undefined;

                if (err) {
                    return reject(err);
                }
                resolve(this.client);
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
            images: { $size: '$postedImages' },
        };

        if (raw) {
            properties['password'] = 1;
        }

        return properties;
    }

    imageAggregationProperties(userId?: string): Object {
        let properties = {
            ownerId: 1,
            filename: 1,
            dateCreated: 1,
            description: 1,
            likes: { $size: '$likedUsers' },
        };

        if (userId !== undefined) {
            properties['isLiked'] = { $in: [ new ObjectID(userId), '$likedUsers' ] };
        }

        return properties;
    }

    // Image methods

    async imageIsOwnedByUser(userId: string, imageId: string) {
        let client = await this.get();

        return new Promise((resolve, reject) => {
            client.db().collection('images').find({
                _id: new ObjectID(imageId),
                ownerId: new ObjectID(userId),
            }, { ownerId: 1 } as Object ).count((error, result) => {
                if (result > 0) {
                    return resolve();
                }
                return reject(new Error('Image not existing or owned by other user.'));
            });
        });
    }

    async getAllImages(query: Object, page: number, limit: number,
        countOnly: boolean = false, userId?: string) {
        let client = await this.get();

        return new Promise((resolve, reject) => {
            if (countOnly) {
                client.db().collection('images').find(query, { _id: 1 } as Object).count().then((res) => {
                    return resolve(res);
                }).catch((error) => {
                    reject(error);
                });
            } else {
                let sortQuery = { dateCreated: -1 };

                client.db().collection('images').aggregate([
                    { $match: query },
                    { $project: this.imageAggregationProperties(userId) },
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
        let client = await this.get();

        return new Promise((resolve, reject) => {
            client.db().collection('images').insertOne(image, (err, result) => {
                if (err) {
                    return reject(err);
                }

                client.db().collection('users').updateOne(
                    { _id: image.ownerId },
                    { $push: { postedImages: result.insertedId } },
                ).then((result) => {
                    resolve(result);
                }).catch((error) => {
                    return reject(error);
                });
            });
        });
    }

    async getOneImage(imageId: string, userId?: string) {
        let client = await this.get();

        return new Promise((resolve, reject) => {
            let query = { _id: new ObjectID(imageId) };

            client.db().collection('images').aggregate([
                { $match: query },
                { $project: this.imageAggregationProperties(userId) },
            ], (error, result) => {
                if (error) {
                    return reject(error);
                }
                result.toArray().then((res) => {
                    resolve(res[0]);
                }).catch(() => {
                    reject('Something went wrong.');
                });
            });
        });
    }

    async updateOneImage(imageId: string, imageUpdates: Object) {
        let client = await this.get();

        return new Promise((resolve, reject) => {
            client.db().collection('images').updateOne({ _id: new ObjectID(imageId) }, imageUpdates, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async deleteOneImage(userId: string, imageId: string) {
        let client = await this.get();

        return new Promise((resolve, reject) => {
            this.imageIsOwnedByUser(userId, imageId).then(() => {
                let imageObjectId = new ObjectID(imageId);

                client.db().collection('users').update({},
                    { $pull: { likedImages: imageObjectId, postedImages: imageObjectId } },
                    { multi: true },
                ).then((result) => {
                    client.db().collection('images').deleteOne({ _id: new ObjectID(imageId) }, (error, result) => {
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
        let client = await this.get();

        return new Promise((resolve, reject) => {
            if (countOnly) {
                client.db().collection('users').find(query, { _id: 1 } as Object).count().then((res) => {
                    return resolve(res);
                }).catch((error) => {
                    reject(error);
                });
            } else {
                client.db().collection('users').aggregate([
                    { $match: query },
                    { $project: this.userAggregationProperties() },
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
        let client = await this.get();

        return new Promise((resolve, reject) => {
            client.db().collection('users').aggregate([
                { $match: { $or: [{ email }, { username }] } },
                { $project: { _id: 1 } },
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
        let client = await this.get();

        return new Promise((resolve, reject) => {
            this.userNotExists(user.username, user.email).then(() => {
                client.db().collection('users').insertOne(user, (error, result) => {
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
        let client = await this.get();

        return new Promise((resolve, reject) => {
            let query: Object = {};

            switch (field) {
                case UserSearchField.Identifier:
                    query = { '_id': new ObjectID(value) };
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
                    reject(error);
                } else if (!result) {
                    let error = new Error('User not found.');
                    reject(error);
                } else {
                    result.toArray().then((res) => {
                        resolve(res[0]);
                    }).catch(() => {
                        reject('Something went wrong.');
                    });
                }
            };

            client.db().collection('users').aggregate([
                { $match: query },
                { $project: this.userAggregationProperties(raw) },
            ], completion);
        });
    }

    async updateOneUser(userId: string, userUpdates: Object) {
        let client = await this.get();

        return new Promise((resolve, reject) => {
            client.db().collection('users').updateOne({ _id: new ObjectID(userId) }, userUpdates, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async deleteOneUser(userId: string) {
        let client = await this.get();

        return new Promise((resolve, reject) => {
            client.db().collection('users').deleteOne({ _id: new ObjectID(userId) }, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

}
