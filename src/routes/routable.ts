import { Request, Response } from 'express';

export interface Routable {

    // Get all objects
    getAll(req: Request, res: Response): void;

    // Create a new object
    createOne(req: Request, res: Response): void;

    // Get an object
    getOne(req: Request, res: Response): void;

    // Update existing object
    updateOne(req: Request, res: Response): void;

    // Delete existing object
    deleteOne(req: Request, res: Response): void;

}
