import { Router, Request, Response, NextFunction } from 'express';

import { DBClient } from '../data/db-client';
import { Routable } from './routable';

export abstract class APIRouter implements Routable {

    router: Router;

    protected subrouters = {};

    // Regex used for single object requests
    protected validationRegex: string;

    constructor(protected dbClient: DBClient, options?: Object) {
        this.router = Router(options);
        this.validationRegex = '[0-9a-zA-Z]+';

        this.connectRouter(this.router);
    }

    protected setupSubrouters(router: Router){
        for (let key in this.subrouters) {
            let value = this.subrouters[key];
            this.router.use(`/:parentId(${this.validationRegex})/${key}`, value.router);
        }
    }

    // Bind routes to router functions

    protected connectRouter(router: Router) {
        // Get all objects
        router.get('/', (req, res, next) => {
            this.getAll(req, res, next);
        });

        // Post new object
        router.post('/', (req, res, next) => {
            this.createOne(req, res, next);
        });

        // Get specific object
        router.get(`/:id(${this.validationRegex})`, (req, res, next) => {
            this.getOne(req, res, next);
        });

        // Edit specific object
        router.put(`/:id(${this.validationRegex})`, (req, res, next) => {
            this.updateOne(req, res, next);
        });

        // Delete specific object
        router.delete(`/:id(${this.validationRegex})`, (req, res, next) => {
            this.deleteOne(req, res, next);
        });
    }

    // Helpers

    sendNotFound(req: Request, res: Response, next: NextFunction,
        message: string = 'Invalid request.') {

        res.status(404).send({
            message: 'Invalid request.'
        });
        next();
    }

    // Router functions

    // Get all objects
    getAll(req: Request, res: Response, next: NextFunction) {
        this.sendNotFound(req, res, next);
    }

    // Create a new object
    createOne(req: Request, res: Response, next: NextFunction) {
        this.sendNotFound(req, res, next);
    }

    // Get an object
    getOne(req: Request, res: Response, next: NextFunction) {
        this.sendNotFound(req, res, next);
    }

    // Update existing object
    updateOne(req: Request, res: Response, next: NextFunction) {
        this.sendNotFound(req, res, next);
    }

    // Delete existing object
    deleteOne(req: Request, res: Response, next: NextFunction) {
        this.sendNotFound(req, res, next);
    }

}
