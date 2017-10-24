import { Router, Request, Response } from 'express';
import { APIRouter } from './api-router';
import { ObjectID } from 'mongodb';

export class UserRouter extends APIRouter {

    createOne(req: Request, res: Response) {
        const note = { text: req.body.body, title: req.body.title };
        this.dbClient.get().collection('notes').insert(note, (err, result) => {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send(result.ops[0]);
            }
        });
    }

    getOne(req: Request, res: Response) {
        const id = req.params.id;
        const details = { '_id': new ObjectID(id) };
        this.dbClient.get().collection('notes').findOne(details, (err, item) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                res.send(item);
            }
        });
    }

    updateOne(req: Request, res: Response) {
        const id = req.params.id;
        const details = { '_id': new ObjectID(id) };
        const note = { text: req.body.body, title: req.body.title };
        this.dbClient.get().collection('notes').update(details, note, (err, result) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                res.send(note);
            }
        });
    }

    deleteOne(req: Request, res: Response) {
        const id = req.params.id;
        const details = { '_id': new ObjectID(id) };
        this.dbClient.get().collection('notes').remove(details, (err, item) => {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                res.send('Note ' + id + ' deleted!');
            }
        });
    }

}
