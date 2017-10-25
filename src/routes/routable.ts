import { Request, Response, NextFunction } from 'express';

export interface Routable {

    // Get all objects
    getAll(req: Request, res: Response, next: NextFunction): void;

    // Create a new object
    createOne(req: Request, res: Response, next: NextFunction): void;

    // Get an object
    getOne(req: Request, res: Response, next: NextFunction): void;

    // Update existing object
    updateOne(req: Request, res: Response, next: NextFunction): void;

    // Delete existing object
    deleteOne(req: Request, res: Response, next: NextFunction): void;

}
