import { Request, Response, NextFunction, Router } from 'express';

import { DBClient } from '../data/db-client';
import { APIRouter } from './api-router';
import { ImageService } from '../services/image-service';

export class UserLikesRouter extends APIRouter {

    constructor(protected dbClient: DBClient, private imageService: ImageService, options?: Object) {
        super(dbClient, options);
    }

    getAll(req: Request, res: Response, next: NextFunction) {
        let userId = req.params.parentId;
        let query = req.query || {};
        let count = Boolean(parseInt(query.count, 10) || 0);
        let limit = parseInt(query.limit, 10) || 25;
        let page = parseInt(query.page, 10) || 0;
        let currentUserId = req['user'].id;

        this.imageService.getAllImagesLikedByUser(userId, page, limit, count, currentUserId).then((result) => {
            res.send({
                'images': result
            });
        }).catch((error) => {
            res.status(400).send({
                'error': error.message
            });
        });
    }

}
