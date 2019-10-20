const APIRouter = require('./api-router');
const StatusCode = require('./status-code');

class UserImagesRouter extends APIRouter {
  constructor(dbClient, imageService, options) {
    super(dbClient, options);
    this.imageService = imageService;
  }

  getAll(req, res) {
    const userId = req.params.parentId;
    const query = req.query || {};
    const count = Boolean(parseInt(query.count, 10) || 0);
    const limit = parseInt(query.limit, 10) || 25;
    const page = parseInt(query.page, 10) || 0;
    const currentUserId = req.user.id;

    this.imageService.getAllImagesForUser(userId, page, limit, count, currentUserId).then((result) => {
      res.status(StatusCode.ok).send({
        images: result
      });
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        message: error.message
      });
    });
  }
}

module.exports = UserImagesRouter;
