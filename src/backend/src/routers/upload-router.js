const Router = require('express').Router;
const multer = require('multer');

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
        res.status(201).send({
          filename: req.file.filename
        });
      } else {
        res.status(400).send({
          message: 'File missing from request. Should be sent as a multipart/form-data.'
        });
      }
    });
  }
}

module.exports = UploadRouter;
