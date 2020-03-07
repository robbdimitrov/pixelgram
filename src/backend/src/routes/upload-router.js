const Router = require('express').Router;
const multer = require('multer');

module.exports = function (imageDir) {
  const router = Router();

  const upload = multer({
    dest: imageDir,
    limits: {
      fileSize: 1000000,
      files: 1
    }
  });

  router.post('/', upload.single('image'), (req, res) => {
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

  return router;
}
