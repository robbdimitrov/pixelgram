import { NextFunction, Request, Response, Router } from 'express';
import * as multer from 'multer';

import * as config from '../../config/server.config';

export class UploadRouter {

    router: Router;

    constructor() {
        this.router = Router();

        this.connectRouter(this.router);
    }

    protected connectRouter(router: Router) {

        let uploader = multer({
            dest: config.imageDir,
            limits: { fileSize: 1000000, files: 1 },
        });

        router.post('/', uploader.single('image'), (req, res, next) => {
            if (req.file) {
                res.send({
                    'filename': req.file.filename,
                });
            } else {
                res.status(400).send({
                    'error': 'File missing from request. Should be sent as a multipart/form-data.',
                });
            }
        });
    }

}
