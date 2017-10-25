import { Request, Response, NextFunction }    from 'express';

import { APIRouter }            from './api-router';

export class ImageRouter extends APIRouter {

    getAll(req: Request, res: Response, next: NextFunction) {
        var query = req.query || {}
        var limit = parseInt(query.limit, 10) || 25
        var page = parseInt(query.page, 10) || 0

        this.dbClient.getAllImages(page, limit).then((result) => {
            res.send(result);
        }).catch((error) => {
            res.send({'error':'An error has occurred ' + error});
        });
    }

}
