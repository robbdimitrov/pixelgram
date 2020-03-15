class ImageController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createImage(req, res) {
    const userId = req.userId;

    const { filename, description } = req.body;

    if (!filename) {
      return res.status(400).send({
        message: 'Image filename is required.'
      });
    }

    this.dbClient.createImage(userId, filename, description)
      .then((result) => {
        res.status(201).send(result);
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  getImages(req, res) {
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 0;
    const currentUserId = req.userId;

    this.dbClient.getImages(page, limit, currentUserId)
      .then((result) => {
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  getImagesByUser(req, res) {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 0;
    const currentUserId = req.userId;

    this.dbClient.getImagesByUser(userId, page, limit, currentUserId)
      .then((result) => {
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  getImagesLikedByUser(req, res) {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 0;
    const currentUserId = req.userId;

    this.dbClient.getImagesLikedByUser(userId, page, limit, currentUserId)
      .then((result) => {
        res.status(200).send({
          items: result
        });
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  getImage(req, res) {
    const imageId = req.params.imageId;
    const currentUserId = req.userId;

    this.dbClient.getImage(imageId, currentUserId)
      .then((result) => {
        if (result) {
          res.status(200).send(result);
        } else {
          res.status(404).send({
            message: 'Image not found.'
          });
        }
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  deleteImage(req, res) {
    const userId = req.userId;
    const imageId = req.params.imageId;

    this.dbClient.deleteImage(imageId, userId)
      .then(() => {
        res.sendStatus(204);
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  likeImage(req, res) {
    const userId = req.userId;
    const imageId = req.params.imageId;

    this.dbClient.likeImage(imageId, userId)
      .then(() => {
        res.sendStatus(204);
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  unlikeImage(req, res) {
    const userId = req.userId;
    const imageId = req.params.imageId;

    this.dbClient.unlikeImage(imageId, userId)
      .then(() => {
        res.sendStatus(204);
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }
}

module.exports = ImageController;
