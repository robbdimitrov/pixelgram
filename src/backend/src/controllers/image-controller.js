const printLog = require('../shared/logger');

class ImageController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createImage(req, res) {
    const { filename, description } = req.body;

    if (!filename) {
      return res.status(400).send({
        message: 'Image filename is required.'
      });
    }

    this.dbClient.createImage(req.userId, filename, description)
      .then((result) => {
        res.status(201).send(result);
      }).catch((error) => {
        printLog(`Creating image failed: ${error}`);
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
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        printLog(`Getting images failed: ${error}`);
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
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        printLog(`Getting images failed: ${error}`);
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
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        printLog(`Getting images failed: ${error}`);
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
          res.status(200).send(result);
        } else {
          res.status(404).send({
            message: 'Not Found'
          });
        }
      }).catch((error) => {
        printLog(`Getting image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  deleteImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.deleteImage(imageId, req.userId)
      .then(() => {
        res.sendStatus(204);
      }).catch((error) => {
        printLog(`Deleting image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  likeImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.likeImage(imageId, req.userId)
      .then(() => {
        res.sendStatus(204);
      }).catch((error) => {
        printLog(`Liking image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }

  unlikeImage(req, res) {
    const imageId = req.params.imageId;

    this.dbClient.unlikeImage(imageId, req.userId)
      .then(() => {
        res.sendStatus(204);
      }).catch((error) => {
        printLog(`Unliking image failed: ${error}`);
        res.status(500).send({
          message: 'Internal Server Error'
        });
      });
  }
}

module.exports = ImageController;
