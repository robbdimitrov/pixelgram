import { Request, Response, NextFunction, Router } from 'express';
import * as multer from 'multer';
import * as bcrypt from 'bcryptjs';

import { APIRouter } from './api-router';
import { User } from '../models/user';
import { UserFactory } from '../models/factories/user-factory';
import * as config from '../../config/server.config';
import { DBClient } from '../data/db-client';

export class UserRouter extends APIRouter {

    connectRouter(router: Router) {
        super.connectRouter(router);

        let uploader = multer({
            dest: config.imageDir,
            limits: { fileSize: 1000000, files: 1 }
        });

        router.post('/upload', uploader.single('avatar'), (req, res, next) => {
            if (req.file) {
                res.send({
                    'success': true,
                    'filename': req.file.filename
                });
            } else {
                res.send({
                    'success': false,
                    'message': 'File missing from request. Should be sent as a multipart/form-data.'
                });
            }
            next();
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
                    'message': 'User with id ' + id + ' is updated.'
                });
            }).catch((err) => {
                res.send({
                    'error': err.message
                })
            });
        };

        if (body.password !== undefined) {
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(body.password, salt, (err, hash) => {
                    body.password = hash;
                    updateClosure(this.dbClient, id, body);
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
                'success': true,
                'message': 'User with id ' + id + ' is no more.'
            });
        }).catch((err) => {
            res.send({
                'error': err.message
            })
        });
    }

}
