class ImageController {
  constructor(dbClient, imageService, options) {
    super(dbClient, options);

    this.imageService = imageService;
  }

  getAll(req, res) {
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 0;
    const userId = req.user.id;
    this.imageService.getAllImages(page, limit, userId).then((result) => {
      res.status(200).send({
        items: result
      });
    }).catch((error) => {
      res.status(400).send({
        message: error.message
      });
    });
  }

  getAllLikedByUser(req, res) {
    const userId = req.params.parentId;
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 20;
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

  getAllByUser(req, res) {
    const userId = req.params.parentId;
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 20;
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

  create(req, res) {
    const body = req.body || {};

    if (!body.filename) {
      res.status(400).send({
        message: 'Missing argument(s). Image filename is expected.'
      });
    }

    const userId = req.user.id;
    const filename = body.filename || '';
    const description = body.description || '';

    this.imageService.createImage(userId, filename, description)
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

  get(req, res) {
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

  delete(req, res) {
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

  // image likes router

  getAll(req, res) {
    const imageId = req.params.parentId;
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 0;

    this.imageService.getUsersLikedImage(imageId, page, limit)
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

  createOne(req, res) {
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

  deleteOne(req, res) {
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
