import { Request, Response, NextFunction, Router } from 'express';

import { DBClient } from '../data/db-client';
import { APIRouter } from './api-router';

export class UserImagesRouter extends APIRouter {

    getAll(req: Request, res: Response, next: NextFunction) {

    }

}
