import { Request, Response, NextFunction, Router } from 'express';

import { APIRouter } from './api-router';
import { User } from '../models/user';
import { UserFactory } from '../models/factories/user-factory';
import { DBClient } from '../data/db-client';
import { AuthService } from '../services/auth-service';
import { UserImagesRouter } from './user-images-router';
import { UserLikesRouter } from './user-likes-router';
import { ImageService } from '../services/image-service';

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

        UserFactory.createUser(name, username, email, password).then((user) => {
            this.dbClient.createOneUser(user).then((result) => {
                res.send({
                    'message': 'User with email ' + result.ops[0].email + ' created successfully.'
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

        if (body.password !== undefined) {
            AuthService.getInstance().generateHash(body.password).then((res) => {
                body.password = res;
                updateClosure(this.dbClient, id, body);
            }).catch((error) => {
                res.send({
                    'error': error.message
                });
            });
        } else {
            updateClosure(this.dbClient, id, body);
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
