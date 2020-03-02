const APIRouter = require('./api-router');

class ImageLikesRouter extends APIRouter {
  constructor(dbClient, imageService, options) {
    super(dbClient, options);
    this.imageService = imageService;
  }

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

module.exports = ImageLikesRouter;
