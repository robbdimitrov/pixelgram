import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';
import { ImageFactory } from '../models/factories/image-factory';
import { ImageUsersRouter } from './image-users-router';

export class ImageRouter extends APIRouter {

    setupSubrouters() {
        let usersRouter = new ImageUsersRouter(this.dbClient, { mergeParams: true });
        this.router.use('/:userId/users', usersRouter.router);

        this.subRouters.push(usersRouter);
    }

    getAll(req: Request, res: Response, next: NextFunction) {
        let query = req.query || {};
        let limit = parseInt(query.limit, 10) || 25;
        let page = parseInt(query.page, 10) || 0;

        this.dbClient.getAllImages(page, limit).then((result) => {
            res.send(result);
        }).catch((error) => {
            res.send({'error':'An error has occurred ' + error});
        });
    }

    createOne(req: Request, res: Response, next: NextFunction) {
        let body = req.body || {}

        if (body.url === undefined) {
            let err = new Error('Missing argument(s). Image url is expected.');

            res.send({
                'error': err.message
            });
            return next(err)
        }

        let userId = req['user'].id;
        let url = body.url || '';
        let description = body.description || '';

        let image = ImageFactory.createImage(userId, url, description);

        this.dbClient.createOneImage(image).then((result) => {
            res.send({
                'success': true,
                'message': 'Image created successfully'
            });
        }).catch((err) => {
            res.send({
                'error': err.message
            });
        });
    }

    getOne(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;

        this.dbClient.getOneImage(id).then((result) => {
            if (result) {
                res.send({
                    'success': true,
                    'image': result
                });
            }
        }).catch((err) => {
            res.send({
                'error': err.message
            })
        });
    }

    updateOne(req: Request, res: Response, next: NextFunction) {
        let userId = req['user'].id;
        let imageId = req.params.id;
        let body = req.body;

        this.dbClient.updateOneImage(userId, imageId, { $set: body }).then((result) => {
            res.send({
                'success': true,
                'message': 'Image is updated.'
            });
        }).catch((err) => {
            res.send({
                'error': err.message
            })
        });
    }

    deleteOne(req: Request, res: Response, next: NextFunction) {
        let userId = req['user'].id;
        let imageId = req.params.id;

        this.dbClient.deleteOneImage(userId, imageId).then((result) => {
            res.send({
                'success': true,
                'message': 'Image is no more.'
            });
        }).catch((err) => {
            res.send({
                'error': err.message
            })
        });
    }

}
