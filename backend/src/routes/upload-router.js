import { Router } from 'express';
import * as multer from 'multer';

export class UploadRouter {
  constructor(imageDir) {
    this.imageDir = imageDir;
    this.router = Router();
    this.connectRouter(this.router);
  }

  connectRouter(router) {
    let uploader = multer({
      dest: this.imageDir,
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