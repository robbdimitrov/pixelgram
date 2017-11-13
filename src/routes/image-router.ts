import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';
import { ImageUsersRouter } from './image-users-router';
import { ImageService } from '../services/image-service';

export class ImageRouter extends APIRouter {

    imageService: ImageService;

    createSubrouters() {
        let usersRouter = new ImageUsersRouter(this.dbClient, { mergeParams: true });
        this.subrouters['users'] = usersRouter;
    }

    getAll(req: Request, res: Response, next: NextFunction) {
        let query = req.query || {};
        let limit = parseInt(query.limit, 10) || 25;
        let page = parseInt(query.page, 10) || 0;

        this.imageService.getAllImages(page, limit).then((result) => {
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

        this.imageService.createImage(userId, url, description).then((result) => {
            res.send({
                'success': true,
                'message': 'Image created successfully'
            });
        }).catch((error) => {
            res.send({
                'error': error.message
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

        this.imageService.deleteImage(imageId, userId).then((result) => {
            res.send({
                'success': true,
                'message': 'Image deleted.'
            });
        }).catch((error) => {
            res.send({
                'error': error.message
            })
        });
    }

}
