import { Router, Request, Response } from 'express';
import { APIRouter } from './api-router';
import { Db } from 'mongodb';

export class ImageRouter extends APIRouter {

    getAll(req: Request, res: Response) {
        var query = req.query || {}
        var limit = parseInt(query.limit, 10) || 25
        var page = parseInt(query.page, 10) || 0

        this.dbClient.get().then((db: Db) => {
            db.collection('images').find({}).skip(page * limit).limit(limit).toArray((err, result) => {
                if (err) {
                    res.send({'error':'An error has occurred'});
                } else {
                    res.send(result);
                }
            });
        });
    }

}
