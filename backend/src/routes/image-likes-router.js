import { APIRouter } from './api-router';

export class ImageLikesRouter extends APIRouter {
  constructor(dbClient, imageService, options) {
    super(dbClient, options);
    this.imageService = imageService;
  }

  getAll(req, res, next) {
    let imageId = req.params.parentId;
    let query = req.query || {};
    let count = Boolean(parseInt(query.count, 10) || 0);
    let limit = parseInt(query.limit, 10) || 25;
    let page = parseInt(query.page, 10) || 0;

    this.imageService.getUsersLikedImage(imageId, page, limit, count).then((result) => {
      res.send({
        'users': result,
      });
    }).catch((error) => {
      res.status(400).send({
        'error': error.message,
      });
    });
  }

  createOne(req, res, next) {
    let imageId = req.params.parentId;
    let userId = req['user'].id;

    this.imageService.likeImage(imageId, userId).then((result) => {
      res.send({
        'message': 'Image liked successfully.',
      });
    }).catch((error) => {
      res.status(400).send({
        'error': error.message,
      });
    });
  }

  deleteOne(req, res, next) {
    let imageId = req.params.parentId;
    let userId = req.params.id;

    if (userId !== req['user'].id) {
      return res.status(403).send({
        'error': 'Can\'t unlike other people\'s likes.',
      });
    }

    this.imageService.unlikeImage(imageId, userId).then((result) => {
      res.send({
        'message': 'Image unliked successfully.',
      });
    }).catch((error) => {
      res.status(400).send({
        'error': error.message,
      });
    });
  }
}
