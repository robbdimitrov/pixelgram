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
    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 0;
    const currentUserId = req.user.id;

    this.imageService.getAllImagesForUser(userId, page, limit, currentUserId)
      .then((result) => {
        res.status(StatusCode.ok).send({
          data: result
        });
      }).catch((error) => {
        res.status(StatusCode.badRequest).send({
          error: {
            code: StatusCode.badRequest,
            message: error.message
          }
        });
      });
  }
}

module.exports = UserImagesRouter;
