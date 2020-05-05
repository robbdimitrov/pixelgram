const multer = require('multer');

module.exports = function (imageDir) {
  const upload = multer({
    dest: imageDir,
    limits: {
      fileSize: 1000000,
      files: 1
    }
  });

  return {
    uploader: upload.single('image'),
    createFile: (req, res) => {
      if (req.file) {
        res.status(201).send({
          filename: req.file.filename
        });
      } else {
        console.log('uploading file failed');
        res.status(400).send({
          message: 'File missing from request.'
        });
      }
    }
  };
};
