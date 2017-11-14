import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';
import { ImageLikesRouter } from './image-likes-router';
import { ImageService } from '../services/image-service';
import { DBClient } from '../data/db-client';

export class ImageRouter extends APIRouter {

    constructor(protected dbClient: DBClient, private imageService: ImageService, options?: Object) {
        super(dbClient, options);

        this.createSubrouters();
        this.setupSubrouters(this.router);
    }

    createSubrouters() {
        let usersRouter = new ImageLikesRouter(this.dbClient,
            this.imageService, { mergeParams: true });
        this.subrouters['likes'] = usersRouter;
    }

    getAll(req: Request, res: Response, next: NextFunction) {
        let query = req.query || {};
        let limit = parseInt(query.limit, 10) || 25;
        let page = parseInt(query.page, 10) || 0;

        this.imageService.getAllImages(page, limit).then((result) => {
            res.send(result);
        }).catch((error) => {
            res.send({
                'error': error.message
            });
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

        this.dbClient.imageIsOwnedByUser(userId, imageId).then(() => {
            this.dbClient.updateOneImage(imageId, { $set: body }).then((result) => {
                res.send({
                    'message': 'Image is updated.'
                });
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
                'message': 'Image deleted.'
            });
        }).catch((error) => {
            res.send({
                'error': error.message
            })
        });
    }

}
