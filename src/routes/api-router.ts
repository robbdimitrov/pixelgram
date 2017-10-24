import { Router, Request, Response } from 'express';
import { DBClient } from '../dbclient';
import { Routable } from './routable';

export class APIRouter implements Routable {

    router: Router;
    validationRegex: string;

    constructor(public dbClient: DBClient) {
        this.router = Router();
        this.validationRegex = '[0-9a-zA-Z]+';

        this.connectRouter(this.router);
    }

    connectRouter(router: Router) {
        router.get('/', this.getAll);
        router.post('/', this.createOne);
        router.get('/:id(${this.validationRegex})', this.getOne);
        router.put('/:id(${this.validationRegex})', this.updateOne);
        router.delete('/:id(${this.validationRegex})', this.deleteOne);
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
