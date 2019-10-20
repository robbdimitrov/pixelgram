const Router = require('express').Router;
const multer = require('multer');

const StatusCode = require('./status-code');

class UploadRouter {
  constructor(imageDir) {
    this.imageDir = imageDir;
    this.router = Router();
    this.connectRouter(this.router);
  }

  connectRouter(router) {
    const uploader = multer({
      dest: this.imageDir,
      limits: { fileSize: 1000000, files: 1 }
    });

    router.post('/', uploader.single('image'), (req, res) => {
      if (req.file) {
        res.status(StatusCode.created).send({
          filename: req.file.filename
        });
      } else {
        res.status(StatusCode.badRequest).send({
          message: 'File missing from request. Should be sent as a multipart/form-data.'
        });
      }
    });
  }
}

module.exports = UploadRouter;
