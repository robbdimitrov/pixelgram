import { Request, Response, NextFunction, Router } from 'express';

import { APIRouter } from './api-router';
import { User } from '../models/user';
import { UserFactory } from '../models/factories/user-factory';
import { DBClient } from '../data/db-client';
import { AuthService } from '../services/auth-service';
import { UserImagesRouter } from './user-images-router';
import { UserLikesRouter } from './user-likes-router';
import { ImageService } from '../services/image-service';
import { BodyParser } from '../services/body-parser';
import { ValidatorService } from '../services/validator-service';

export class UserRouter extends APIRouter {

    constructor(protected dbClient: DBClient, private imageService: ImageService, options?: Object) {
        super(dbClient, options);

        this.createSubrouters();
        this.setupSubrouters(this.router);
    }

    createSubrouters() {
        let imagesRouter = new UserImagesRouter(this.dbClient,
            this.imageService, { mergeParams: true });
        this.subrouters['images'] = imagesRouter;

        let likedRouter = new UserLikesRouter(this.dbClient,
            this.imageService, { mergeParams: true });
        this.subrouters['likes'] = likedRouter;
    }

    getAll(req: Request, res: Response, next: NextFunction) {
        let query = req.query || {};
        let limit = parseInt(query.limit, 10) || 25;
        let page = parseInt(query.page, 10) || 0;

        this.dbClient.getAllUsers({}, page, limit).then((result) => {
            res.send({
                'users': result
            });
        }).catch((error) => {
            res.send({
                'error': error.message
            });
        });
    }

    createOne(req: Request, res: Response, next: NextFunction) {
        let body = req.body || {}

        if (body.name === undefined || body.username === undefined ||
            body.email === undefined || body.password === undefined) {

            let err = new Error('Missing argument(s). name, username, email and password are expected.');

            res.send({
                'error': err.message
            });
            return next(err)
        }

        let name = body.name || '';
        let username = body.username || '';
        let email = body.email || '';
        let password = body.password || '';

        if (password === '') {
            return res.send({
                'error': 'Password can\'t be empty.'
            });
        }

        if (!ValidatorService.isValidEmail(email)) {
            return res.send({
                'error': 'Invalid email address.'
            });
        }

        UserFactory.createUser(name, username, email, password).then((user) => {
            this.dbClient.createOneUser(user).then((result) => {
                res.send({
                    'message': 'User with email ' + email + ' created successfully.'
                });
            }).catch((error) => {
                res.send({
                    'error': error.message
                });
            });
        });
    }

    getOne(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;

        this.dbClient.getOneUser(id).then((result) => {
            if (result) {
                res.send({
                    'user': result
                });
            }
        }).catch((error) => {
            res.send({
                'error': error.message
            })
        });
    }

    updateOne(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;
        let body = req.body;

        if (id !== req['user'].id) {
            return res.status(403).send({
                'error': 'Can\'t update other people\'s accounts.'
            });
        }

        if (Object.keys(body).length < 1) {
            res.send({
                'message': 'Nothing to update.'
            });
        }

        let allowedKeys = ['name', 'username', 'email', 'avatar', 'bio'];
        let updatedUser = BodyParser.parseBodyParametersToObject(body, allowedKeys);

        let updateClosure = (dbClient: DBClient, id: string, updatedUser: Object) => {
            dbClient.updateOneUser(id, { $set: updatedUser }).then((result) => {
                res.send({
                    'message': 'User updated successfully.'
                });
            }).catch((error) => {
                res.send({
                    'error': error.message
                });
            });
        };

        if (body.email !== undefined) {
            if (!ValidatorService.isValidEmail(body.email)) {
                return res.send({
                    'error': 'Invalid email address.'
                });
            }
        }

        if (body.password !== undefined) {
            let password = body.password;
            let oldPassword = body.oldPassword;

            if (oldPassword === undefined) {
                return res.send({
                    'error': 'Both password and the current password are required.'
                });
            }

            if (password === '') {
                return res.send({
                    'error': 'Password can\'t be empty.'
                });
            }

            this.dbClient.getOneUser(req['user'].id, undefined, undefined, true).then((user) => {
                AuthService.getInstance().validatePassword(oldPassword, user.password).then((value) => {
                    AuthService.getInstance().generateHash(password).then((res) => {
                        updatedUser['password'] = res;
                        updateClosure(this.dbClient, id, updatedUser);
                    });
                }).catch((error) => {
                    res.send({
                        'error': 'Wrong password. Enter the correct current password.'
                    });
                });
            }).catch((error) => {
                res.send({
                    'error': error.message
                });
            });
        } else {
            updateClosure(this.dbClient, id, updatedUser);
        }
    }

    deleteOne(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;

        if (id !== req['user'].id) {
            return res.status(403).send({
                'error': 'Can\'t delete other people\'s accounts.'
            });
        }

        this.dbClient.deleteOneUser(id).then((result) => {
            res.send({
                'message': 'User deleted successfully.'
            });
        }).catch((error) => {
            res.send({
                'error': error.message
            });
        });
    }

}
