import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';
import { ImageLikesRouter } from './image-likes-router';
import { ImageService } from '../services/image-service';
import { BodyParser } from '../services/body-parser';
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
        let userId = req['user'].id;
        console.log('get all images called');
        this.imageService.getAllImages(page, limit, userId).then((result) => {
            res.send({
                'images': result
            });
        }).catch((error) => {
            res.status(400).send({
                'error': error.message
            });
        });
    }

    createOne(req: Request, res: Response, next: NextFunction) {
        let body = req.body || {};

        if (body.filename === undefined) {
            let error = new Error('Missing argument(s). Image filename is expected.');

            res.status(400).send({
                'error': error.message
            });
            return next(error);
        }

        let userId = req['user'].id;
        let filename = body.filename || '';
        let description = body.description || '';

        this.imageService.createImage(userId, filename, description).then((result) => {
            res.send({
                'message': 'Image created successfully.'
            });
        }).catch((error) => {
            res.status(400).send({
                'error': error.message
            });
        });
    }

    getOne(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;
        let userId = req['user'].id;

        this.dbClient.getOneImage(id, userId).then((result) => {
            if (result) {
                res.send({
                    'image': result
                });
            }
        }).catch((error) => {
            res.status(400).send({
                'error': error.message
            });
        });
    }

    updateOne(req: Request, res: Response, next: NextFunction) {
        let userId = req['user'].id;
        let imageId = req.params.id;
        let body = req.body;

        let updatedImage = BodyParser.parseBodyParametersToObject(body, ['description']);

        this.dbClient.imageIsOwnedByUser(userId, imageId).then(() => {
            this.dbClient.updateOneImage(imageId, { $set: updatedImage }).then((result) => {
                res.send({
                    'message': 'Image updated successfully.'
                });
            });
        }).catch((error) => {
            res.status(400).send({
                'error': error.message
            });
        });

    }

    deleteOne(req: Request, res: Response, next: NextFunction) {
        let userId = req['user'].id;
        let imageId = req.params.id;

        this.imageService.deleteImage(imageId, userId).then((result) => {
            res.send({
                'message': 'Image deleted successfully.'
            });
        }).catch((error) => {
            res.status(400).send({
                'error': error.message
            });
        });
    }

}
