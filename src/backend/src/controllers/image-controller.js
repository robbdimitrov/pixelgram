const {logInfo, logError} = require('../shared/logger');

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
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 0;

    this.dbClient.getFeed(page, limit, req.userId)
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
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 0;

    this.dbClient.getImages(userId, page, limit, req.userId)
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
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 0;

    this.dbClient.getLikedImages(userId, page, limit, req.userId)
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
      .then(() => {
        logInfo('Successfully deleted image');
        res.sendStatus(204);
      }).catch((error) => {
        logError(`Deleting image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  likeImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.likeImage(imageId, req.userId)
      .then(() => {
        logInfo('Successfully liked image');
        res.sendStatus(204);
      }).catch((error) => {
        logError(`Liking image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  unlikeImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.unlikeImage(imageId, req.userId)
      .then(() => {
        logInfo('Successfully unliked image');
        res.sendStatus(204);
      }).catch((error) => {
        logError(`Unliking image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }
}

module.exports = ImageController;
