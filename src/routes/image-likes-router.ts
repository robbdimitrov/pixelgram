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

        if (count === true) {
            this.imageService.getNumberOfUsersLikedImage(imageId, page, limit).then((result) => {
                res.send({ 'users': result })
            }).catch((error) => {
                res.send({
                    'error': error.message
                });
            });
        } else {
            this.imageService.getUsersLikedImage(imageId, page, limit).then((result) => {
                res.send({ 'likes': result })
            }).catch((error) => {
                res.send({
                    'error': error.message
                });
            });
        }
    }

}
