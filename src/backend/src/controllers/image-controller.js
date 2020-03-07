class ImageController {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  createImage(req, res) {
    const body = req.body || {};
    const { filename, description } = body;
    const userId = req.user.id;

    if (!filename) {
      res.status(400).send({
        message: 'Missing argument(s). Image filename is expected.'
      });
    }

    this.dbClient.createImage(userId, filename, description || '')
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
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 10;
    const page = parseInt(query.page, 10) || 0;
    const userId = req.user.id;
    this.dbClient.getAllImages(page, limit, userId).then((result) => {
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
    const userId = req.params.parentId;
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 10;
    const page = parseInt(query.page, 10) || 0;
    const currentUserId = req.user.id;

    this.imageService.getAllImagesForUser(userId, page, limit, currentUserId)
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
    const userId = req.params.parentId;
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 10;
    const page = parseInt(query.page, 10) || 0;
    const currentUserId = req.user.id;

    this.imageService.getAllImagesLikedByUser(
      userId, page, limit, currentUserId).then((result) => {
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
    const id = req.params.id;
    const userId = req.user.id;

    this.dbClient.getImage(id, userId).then((result) => {
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
    const userId = req.user.id;
    const imageId = req.params.id;

    this.imageService.deleteImage(imageId, userId).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      res.status(400).send({
        message: error.message
      });
    });
  }

  likeImage(req, res) {
    const imageId = req.params.parentId;
    const userId = req.user.id;

    this.imageService.likeImage(imageId, userId).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      res.status(400).send({
        message: error.message
      });
    });
  }

  unlikeImage(req, res) {
    const imageId = req.params.parentId;
    const userId = req.params.id;

    if (userId !== req.user.id) {
      return res.status(403).send({
        message: 'Can\'t unlike other people\'s likes.'
      });
    }

    this.imageService.unlikeImage(imageId, userId).then(() => {
      res.sendStatus(204);
    }).catch((error) => {
      res.status(400).send({
        message: error.message
      });
    });
  }
}

module.exports = ImageController;
