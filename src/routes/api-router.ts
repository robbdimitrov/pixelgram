import { Router, Request, Response }  from 'express';

import { DBClient }                   from '../data/db-client';
import { Routable }                   from './routable';

export abstract class APIRouter implements Routable {

    router: Router;
    protected validationRegex: string;

    constructor(protected dbClient: DBClient) {
        this.router = Router();
        this.validationRegex = '[0-9a-zA-Z]+';

        this.connectRouter(this.router);
    }

    private connectRouter(router: Router) {
        router.get('/', this.getAll.bind(this));
        router.post('/', this.createOne.bind(this));
        router.get(`/:id(${this.validationRegex})`, this.getOne.bind(this));
        router.put(`/:id(${this.validationRegex})`, this.updateOne.bind(this));
        router.delete(`/:id(${this.validationRegex})`, this.deleteOne.bind(this));
    }

    // Get all objects
    getAll(req: Request, res: Response) {
        res.status(404).send({
            message: 'Invalid request.',
            status: res.status
        });
    }

    // Create a new object
    createOne(req: Request, res: Response) {
        res.status(404).send({
            message: 'Invalid request.',
            status: res.status
        });
    }

    // Get an object
    getOne(req: Request, res: Response) {
        res.status(404).send({
            message: 'Invalid request.',
            status: res.status
        });
    }

    // Update existing object
    updateOne(req: Request, res: Response) {
        res.status(404).send({
            message: 'Invalid request.',
            status: res.status
        });
    }

    // Delete existing object
    deleteOne(req: Request, res: Response) {
        res.status(404).send({
            message: 'Invalid request.',
            status: res.status
        });
    }

}
