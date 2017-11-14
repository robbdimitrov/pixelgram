import { Request, Response, NextFunction, Router } from 'express';

import { DBClient } from '../data/db-client';
import { APIRouter } from './api-router';
import { ImageService } from '../services/image-service';

export class ImageLikesRouter extends APIRouter {

    constructor(protected dbClient: DBClient, private imageService: ImageService, options?: Object) {
        super(dbClient, options);
    }

    getAll(req: Request, res: Response, next: NextFunction) {
        let imageId = req.params.parentId;
        let query = req.query || {};
        let count = Boolean(parseInt(query.count, 10) || 0);
        let limit = parseInt(query.limit, 10) || 25;
        let page = parseInt(query.page, 10) || 0;

        this.imageService.getUsersLikedImage(imageId, page, limit, count).then((result) => {
            res.send({
                'likes': result
            });
        }).catch((error) => {
            res.send({
                'error': error.message
            });
        });
    }

    createOne(req: Request, res: Response, next: NextFunction) {
        let imageId = req.params.parentId;
        let userId = req['user'].id;

        this.imageService.likeImage(imageId, userId).then((result) => {
            res.send({
                'message': 'Image liked successfully.'
            });
        }).catch((error) => {
            res.send({
                'error': error.message
            });
        });
    }

    deleteOne(req: Request, res: Response, next: NextFunction) {
        let imageId = req.params.parentId;
        let userId = req.params.id;

        if (userId !== req['user'].id) {
            return res.send({
                'error': 'Can\'t unlike other people\'s likes.'
            });
        }

        this.imageService.unlikeImage(imageId, userId).then((result) => {
            res.send({
                'message': 'Image unliked successfully.'
            });
        }).catch((error) => {
            res.send({
                'error': error.message
            });
        });
    }

}
