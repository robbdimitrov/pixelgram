import { Request, Response, NextFunction, Router } from 'express';

import { APIRouter } from './api-router';
import { User } from '../models/user';
import { UserFactory } from '../models/factories/user-factory';
import { DBClient } from '../data/db-client';
import { AuthService } from '../services/auth-service';

export class UserRouter extends APIRouter {

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
                    'success': true,
                    'message': 'User ' + result.ops[0].email + ' created successfully'
                });
            }).catch((err) => {
                res.send({
                    'error': err.message
                });
            });
        });
    }

    getOne(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;

        this.dbClient.getOneUser(id).then((result) => {
            if (result) {
                res.send({
                    'success': true,
                    'user': result
                });
            }
        }).catch((err) => {
            res.send({
                'error': err.message
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
                    'success': true,
                    'message': 'User is updated.'
                });
            }).catch((err) => {
                res.send({
                    'error': err.message
                })
            });
        };

        if (body.password !== undefined) {
            AuthService.getInstance().generateHash(body.password).then((res) => {
                body.password = res;
                updateClosure(this.dbClient, id, body);
            }).catch((err) => {
                res.send({
                    'error': err.message
                })
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
                'success': true,
                'message': 'User is no more.'
            });
        }).catch((err) => {
            res.send({
                'error': err.message
            })
        });
    }

}
