import { APIRouter } from "./api-router";

export class UserImagesRouter extends APIRouter {
  constructor(dbClient, imageService, options) {
    super(dbClient, options);
    this.imageService = imageService;
  }

  getAll(req, res) {
    let userId = req.params.parentId;
    let query = req.query || {};
    let count = Boolean(parseInt(query.count, 10) || 0);
    let limit = parseInt(query.limit, 10) || 25;
    let page = parseInt(query.page, 10) || 0;
    let currentUserId = req["user"].id;

    this.imageService.getAllImagesForUser(userId, page, limit, count, currentUserId).then((result) => {
      res.send({
        "images": result,
      });
    }).catch((error) => {
      res.status(400).send({
        "code": 400,
        "error": "BAD_REQUEST",
        "message": error.message,
      });
    });
  }
}
