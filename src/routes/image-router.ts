import { Request, Response, NextFunction } from 'express';

import { APIRouter } from './api-router';
import { ImageFactory } from '../models/factories/image-factory';

export class ImageRouter extends APIRouter {

    getAll(req: Request, res: Response, next: NextFunction) {
        let query = req.query || {};
        let limit = parseInt(query.limit, 10) || 25;
        let page = parseInt(query.page, 10) || 0;

        this.dbClient.getAllImages(page, limit).then((result) => {
            res.send(result);
        }).catch((error) => {
            res.send({'error':'An error has occurred ' + error});
        });
    }

    createOne(req: Request, res: Response, next: NextFunction) {
        let body = req.body || {}

        if (body.url === undefined) {
            let err = new Error('Missing argument(s). Image url is expected.');

            res.send({
                'error': err.message
            });
            return next(err)
        }

        let userID = req['user'].id;
        let url = body.url || '';
        let description = body.description || '';

        let image = ImageFactory.createImage(userID, url, description);

        this.dbClient.createOneImage(image).then((result) => {
            res.send({
                'success': true,
                'message': 'Image created successfully'
            });
        }).catch((err) => {
            res.send({
                'error': err.message
            });
        });
    }

    getOne(req: Request, res: Response, next: NextFunction) {
        let id = req.params.id;

        this.dbClient.getOneImage(id).then((result) => {
            if (result) {
                res.send({
                    'success': true,
                    'image': result
                });
            }
        }).catch((err) => {
            res.send({
                'error': err.message
            })
        });
    }

    updateOne(req: Request, res: Response, next: NextFunction) {
        let userID = req['user'].id;
        let imageID = req.params.id;
        let body = req.body;

        this.dbClient.updateOneImage(userID, imageID, { $set: body }).then((result) => {
            res.send({
                'success': true,
                'message': 'Image is updated.'
            });
        }).catch((err) => {
            res.send({
                'error': err.message
            })
        });
    }

    deleteOne(req: Request, res: Response, next: NextFunction) {
        let userID = req['user'].id;
        let imageID = req.params.id;

        this.dbClient.deleteOneImage(userID, imageID).then((result) => {
            res.send({
                'success': true,
                'message': 'Image is no more.'
            });
        }).catch((err) => {
            res.send({
                'error': err.message
            })
        });
    }

}
