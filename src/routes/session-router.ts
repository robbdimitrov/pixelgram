import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';

export class SessionRouter extends APIRouter {

    createOne(req: Request, res: Response, next: NextFunction) {
        let body = req.body || {}

        if (body.email === undefined || body.password === undefined) {

            let err = new Error('Missing argument(s). Email and password are required.');

            res.send({
                'error': err.message
            });
            return next(err)
        }

        let email = body.email || '';
        let password = body.password || '';

        this.dbClient.login(email, password).then((result) => {
            res.send({
                'success': true,
                'user': result.user,
                'token': result.token
            });
        }).catch((error) => {
            res.send({
                'error': error.message
            });
        });
    }

}
