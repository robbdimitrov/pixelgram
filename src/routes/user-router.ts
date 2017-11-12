import { Request, Response, NextFunction, Router } from 'express';
import * as multer from 'multer';

import { APIRouter } from './api-router';
import { User } from '../models/user';
import { UserFactory } from '../models/factories/user-factory';
import * as config from '../../config/server.config';
import { DBClient } from '../data/db-client';

export class UserRouter extends APIRouter {

    connectRouter(router: Router) {
        super.connectRouter(router);

        let uploader = multer({
            dest: '../' + config.imageDir,
            limits: { fileSize: 1000000, files: 1 }
        });

        router.post('/upload', uploader.single('avatar'), (req, res, next) => {

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

    updateOne(req: Request, res: Response, next: NextFunction) {

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

    deleteOne() {

    }

}
