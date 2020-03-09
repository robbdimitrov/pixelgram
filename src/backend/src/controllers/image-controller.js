class ImageController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createImage(req, res) {
    const userId = req.userId;

    const { filename, description } = req.body;

    if (!filename) {
      res.status(400).send({
        message: 'Missing argument(s). Image filename is expected.'
      });
    }

    this.dbClient.createImage(userId, filename, description)
      .then((result) => {
        res.status(201).send({
          id: result
        });
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

    this.dbClient.getAllImages(page, limit, currentUserId)
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

    this.dbClient.getAllImagesLikedByUser(userId, page, limit, currentUserId)
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
    const id = req.params.imageId;
    const currentUserId = req.userId;

    this.dbClient.getImage(id, currentUserId)
      .then((result) => {
        if (result) {
          res.status(200).send(result);
        }
      }).catch((error) => {
        res.status(400).send({
          message: error.message
        });
      });
  }

  deleteImage(req, res) {
    const userId = req.params.userId;
    const imageId = req.params.imageId;

    if (userId !== req.userId) {
      return res.status(403).send({
        message: 'Can\'t delete other people\'s images.'
      });
    }

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
    const userId = req.params.userId;
    const imageId = req.body.imageId;

    if (userId !== req.userId) {
      return res.status(403).send({
        message: 'Can\'t like other people\'s likes.'
      });
    }

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
    const userId = req.params.userId;
    const imageId = req.params.imageId;

    if (userId !== req.userId) {
      return res.status(403).send({
        message: 'Can\'t unlike other people\'s likes.'
      });
    }

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
