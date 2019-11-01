const APIRouter = require('./api-router');
const StatusCode = require('./status-code');

class ImageLikesRouter extends APIRouter {
  constructor(dbClient, imageService, options) {
    super(dbClient, options);
    this.imageService = imageService;
  }

  getAll(req, res) {
    const imageId = req.params.parentId;
    const query = req.query || {};
    const count = Boolean(parseInt(query.count, 10) || 0);
    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 0;

    this.imageService.getUsersLikedImage(imageId, page, limit, count).then((result) => {
      res.status(StatusCode.ok).send({
        users: result
      });
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        message: error.message
      });
    });
  }

  createOne(req, res) {
    const imageId = req.params.parentId;
    const userId = req.user.id;

    this.imageService.likeImage(imageId, userId).then(() => {
      res.sendStatus(StatusCode.noContent);
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        message: error.message
      });
    });
  }

  deleteOne(req, res) {
    const imageId = req.params.parentId;
    const userId = req.params.id;

    if (userId !== req.user.id) {
      return res.status(StatusCode.forbidden).send({
        message: 'Can\'t unlike other people\'s likes.'
      });
    }

    this.imageService.unlikeImage(imageId, userId).then(() => {
      res.sendStatus(StatusCode.noContent);
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        message: error.message
      });
    });
  }
}

module.exports = ImageLikesRouter;
