import { ObjectID, Db, MongoClient } from 'mongodb';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import { DBClient } from './db-client';
import { User } from '../models/user';
import { UserFactory } from '../models/factories/user-factory';
import * as config from '../../config/server.config';

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

    async getAllImages(page: number, limit: number) {
        let db = await this.get();
        return new Promise((resolve, reject) => {
            db.collection('images').find().skip(page * limit).limit(limit).toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve(result);
            });
        });
    }

    // User methods

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

    async getOneUser(userID: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('users').findOne({ _id: new ObjectID(userID) }, (err, result) => {
                if (err) {
                    return reject(err);
                }

                let user = UserFactory.createJsonUser(result);
                resolve(user);
            });
        });
    }

    async updateOneUser(userID: string, userUpdates: Object) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('users').updateOne({ _id: new ObjectID(userID) }, userUpdates, (err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    async deleteOneUser(userID: string) {
        let db = await this.get();

        return new Promise((resolve, reject) => {
            db.collection('users').deleteOne({ _id: new ObjectID(userID) }, (err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    // Authentication

    async login(email: string, password: string) {
        let db = await this.get();
        return new Promise((resolve, reject) => {
            db.collection('users').findOne({
                email: email
            }, (err, result) => {
                if (err) {
                    return reject(err);
                }

                if (result === undefined) {
                    return reject(new Error('Authentication failed. User not found.'));
                }

                bcrypt.compare(password, result.password).then((res) => {
                    if (res === true) {
                        let authObject = new Object();
                        authObject['user'] = UserFactory.createJsonUser(result);

                        let payload = {
                            username: authObject['user']['username'],
                            id: authObject['user']['id']
                        };

                        let token = jwt.sign(payload, config.secret, {
                            expiresIn: '1h'
                        });

                        authObject['token'] = token;

                        return resolve(authObject);
                    } else {
                        return reject(new Error('Authentication failed. Incorrect email or password.'));
                    }
                }).catch((err) => {
                    return reject(new Error('Authentication failed. ' + err));
                });
            });
        });
    }

}
