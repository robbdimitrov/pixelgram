const multer = require('multer');
const fs = require('fs/promises');

const signatures = [
  {bytes: [0xff, 0xd8, 0xff]},
  {bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]},
  {bytes: [0x47, 0x49, 0x46, 0x38]},
  {bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, secondary: {bytes: [0x57, 0x45, 0x42, 0x50], offset: 8}}
];

function hasBytes(buffer, bytes, offset = 0) {
  if (buffer.length < offset + bytes.length) {
    return false;
  }

  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function isImage(buffer) {
  return signatures.some((signature) => {
    if (!hasBytes(buffer, signature.bytes, signature.offset)) {
      return false;
    }

    return !signature.secondary ||
      hasBytes(buffer, signature.secondary.bytes, signature.secondary.offset);
  });
}

module.exports = function (imageDir, dbClient) {
  const upload = multer({
    dest: imageDir,
    limits: {
      fileSize: 1000000,
      files: 1
    }
  });

  return {
    uploader: upload.single('image'),
    handleUploadError: (error, res) => {
      if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
          ? 'Choose an image under 1MB.'
          : 'Could not process upload.';
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

        return res.status(status).send({message});
      }

      return res.status(400).send({
        message: 'Could not process upload.'
      });
    },
    createFile: (req, res) => {
      if (!req.file) {
        return res.status(400).send({
          message: 'File missing from request.'
        });
      }

      fs.readFile(req.file.path).then((file) => {
        if (!isImage(file)) {
          return fs.unlink(req.file.path).catch(() => undefined).then(() => {
            res.status(400).send({
              message: 'Only image uploads are allowed.'
            });
          });
        }

        return dbClient.createUpload(req.userId, req.file.filename).then(() => {
          res.status(201).send({
            filename: req.file.filename
          });
        });
      }).catch(() => {
        res.status(400).send({
          message: 'Could not process upload.'
        });
      });
    }
  };
};
