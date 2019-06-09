import { APIRouter } from './api-router';

export class UserImagesRouter extends APIRouter {
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
      res.send({
        images: result,
      });
    }).catch((error) => {
      res.status(400).send({
        code: 400,
        error: 'BAD_REQUEST',
        message: error.message,
      });
    });
  }
}
