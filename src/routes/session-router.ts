import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';
import { AuthService } from '../services/auth-service';
import { UserFactory } from '../models/factories/user-factory';

export class SessionRouter extends APIRouter {

    createOne(req: Request, res: Response, next: NextFunction) {
        let body = req.body || {}

        if (body.email === undefined || body.password === undefined) {
            let error = new Error('Missing argument(s). Email and password are required.');
            res.status(400).send({
                'error': error.message
            });
            return next(error)
        }

        let email = body.email || '';
        let password = body.password || '';

        this.dbClient.getOneUser('email', email, true).then((user) => {
            AuthService.getInstance().validatePassword(password, user.password).then((result) => {
                if (result === true) {
                    delete user['password'];
                    let token = AuthService.getInstance().generateToken(user);
                    res.send({
                        'user': user,
                        'token': token
                    });
                } else {
                    res.status(401).send({
                        'error': 'Authentication failed. Incorrect email or password.'
                    });
                }
            });
        }).catch((error) => {
            res.status(401).send({
                'error': error.message
            });
        });
    }

}
