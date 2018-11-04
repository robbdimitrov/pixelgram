import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';
import { AuthService } from '../services/auth-service';
import { UserFactory } from '../services/user-factory';
import { UserSearchField } from '../data/db-client';

export class SessionRouter extends APIRouter {

    createOne(req: Request, res: Response, next: NextFunction) {
        let body = req.body || {};

        if (body.email === undefined || body.password === undefined) {
            let error = new Error('Missing argument(s). Email and password are required.');
            res.status(400).send({
                'error': error.message
            });
            return next(error);
        }

        let email = body.email || '';
        let password = body.password || '';

        let authFailedBlock = () => {
            res.status(401).send({
                'error': 'Authentication failed. Incorrect email or password.'
            });
        };

        console.log(`Login for user ${email}`);

        this.dbClient.getOneUser(UserSearchField.Email, email, true).then((user) => {
            console.log(`Found user ${JSON.stringify(user)}`);

            if (user === undefined) {
                return authFailedBlock();
            }

            AuthService.getInstance().validatePassword(password, user.password).then((result) => {
                if (result === true) {
                    delete user['password'];
                    let token = AuthService.getInstance().generateToken(user);
                    res.send({
                        'user': user,
                        'token': token
                    });
                } else {
                    authFailedBlock();
                }
            });
        }).catch((error) => {
            res.status(401).send({
                'error': error.message
            });
        });
    }

}
