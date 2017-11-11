import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';

import { User } from '../models/user';
import { UserFactory } from '../models/factories/user-factory';

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
            }).catch((error) => {
                res.send({
                    'error': error.message
                });
            });
        });
    }

}
