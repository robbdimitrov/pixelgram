import { Request, Response, NextFunction, Router } from 'express';

import { DBClient } from '../data/db-client';
import { APIRouter } from './api-router';
import { ImageService } from '../services/image-service';

export class UserImagesRouter extends APIRouter {

    constructor(protected dbClient: DBClient, private imageService: ImageService, options?: Object) {
        super(dbClient, options);
    }

    getAll(req: Request, res: Response, next: NextFunction) {
        let userId = req.params.parentId;
    }

}
