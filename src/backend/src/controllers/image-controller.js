const {logInfo, logError} = require('../shared/logger');
const {parsePagination} = require('../shared/utils');

class ImageController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createImage(req, res) {
    const {filename, description} = req.body;

    if (!filename) {
      logError('Creating image failed: Missing filename');
      return res.status(400).send({
        message: 'Image filename is required.'
      });
    }

    this.dbClient.createImage(req.userId, filename, description)
      .then((result) => {
        if (!result) {
          logError('Creating image failed: Upload not found');
          return res.status(400).send({
            message: 'Upload is invalid or expired.'
          });
        }

        logInfo('Successfully created image');
        res.status(201).send(result);
      }).catch((error) => {
        logError(`Creating image failed: ${error}`);
        res.status(400).send({
          message: 'Bad Request'
        });
      });
  }

  getFeed(req, res) {
    const pagination = parsePagination(req.query);

    if (!pagination) {
      return res.status(400).send({
        message: 'Invalid pagination parameters.'
      });
    }

    this.dbClient.getFeed(pagination.page, pagination.limit, req.userId)
      .then((result) => {
        logInfo('Successfully fetched feed');
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        logError(`Getting feed failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  getImages(req, res) {
    const userId = req.params.userId;
    const pagination = parsePagination(req.query);

    if (!pagination) {
      return res.status(400).send({
        message: 'Invalid pagination parameters.'
      });
    }

    this.dbClient.getImages(userId, pagination.page, pagination.limit, req.userId)
      .then((result) => {
        logInfo('Successfully fetched images');
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        logError(`Getting images failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  getLikedImages(req, res) {
    const userId = req.params.userId;
    const pagination = parsePagination(req.query);

    if (!pagination) {
      return res.status(400).send({
        message: 'Invalid pagination parameters.'
      });
    }

    this.dbClient.getLikedImages(userId, pagination.page, pagination.limit, req.userId)
      .then((result) => {
        logInfo('Successfully fetched liked images');
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        logError(`Getting liked images failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  getImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.getImage(imageId, req.userId)
      .then((result) => {
        if (result) {
          logInfo('Successfully fetched image');
          res.status(200).send(result);
        } else {
          logError('Getting image failed: Not Found');
          res.status(404).send({
            message: 'Not Found'
          });
        }
      }).catch((error) => {
        logError(`Getting image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  deleteImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.deleteImage(imageId, req.userId)
      .then((rowCount) => {
        if (rowCount) {
          logInfo('Successfully deleted image');
          return res.sendStatus(204);
        }

        return this.dbClient.getImage(imageId, req.userId).then((image) => {
          if (image) {
            logError('Deleting image failed: Forbidden');
            return res.status(403).send({
              message: 'Forbidden'
            });
          }

          logError('Deleting image failed: Not Found');
          return res.status(404).send({
            message: 'Not Found'
          });
        });
      }).catch((error) => {
        logError(`Deleting image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  likeImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.imageExists(imageId)
      .then((exists) => {
        if (!exists) {
          return false;
        }

        return this.dbClient.likeImage(imageId, req.userId).then(() => true);
      })
      .then((exists) => {
        if (!exists) {
          logError('Liking image failed: Not Found');
          return res.status(404).send({
            message: 'Not Found'
          });
        }

        logInfo('Successfully liked image');
        return res.sendStatus(204);
      }).catch((error) => {
        logError(`Liking image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  unlikeImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.imageExists(imageId)
      .then((exists) => {
        if (!exists) {
          return false;
        }

        return this.dbClient.unlikeImage(imageId, req.userId).then(() => true);
      })
      .then((exists) => {
        if (!exists) {
          logError('Unliking image failed: Not Found');
          return res.status(404).send({
            message: 'Not Found'
          });
        }

        logInfo('Successfully unliked image');
        return res.sendStatus(204);
      }).catch((error) => {
        logError(`Unliking image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }
}

module.exports = ImageController;
