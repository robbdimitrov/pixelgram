import { BodyParser } from '../services/body-parser';
import { APIRouter } from './api-router';
import { ImageLikesRouter } from './image-likes-router';

export class ImageRouter extends APIRouter {
  constructor(dbClient, imageService, options) {
    super(dbClient, options);

    this.imageService = imageService;
    this.createSubrouters();
    this.setupSubrouters(this.router);
  }

  createSubrouters() {
    const usersRouter = new ImageLikesRouter(this.dbClient,
      this.imageService, { mergeParams: true });
    this.subrouters['likes'] = usersRouter;
  }

  getAll(req, res) {
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 25;
    const page = parseInt(query.page, 10) || 0;
    const userId = req['user'].id;
    this.imageService.getAllImages(page, limit, userId).then((result) => {
      res.send({
        'images': result,
      });
    }).catch((error) => {
      res.status(400).send({
        'code': 400,
        'error': 'BAD_REQUEST',
        'message': error.message,
      });
    });
  }

  createOne(req, res) {
    const body = req.body || {};

    if (body.filename === undefined) {
      const error = new Error('Missing argument(s). Image filename is expected.');

      res.status(400).send({
        'code': 400,
        'error': 'BAD_REQUEST',
        'message': error.message,
      });
    }

    const userId = req['user'].id;
    const filename = body.filename || '';
    const description = body.description || '';

    this.imageService.createImage(userId, filename, description).then(() => {
      res.send({
        'message': 'Image created successfully.',
      });
    }).catch((error) => {
      res.status(400).send({
        'code': 400,
        'error': 'BAD_REQUEST',
        'message': error.message,
      });
    });
  }

  getOne(req, res) {
    const id = req.params.id;
    const userId = req['user'].id;

    this.dbClient.getOneImage(id, userId).then((result) => {
      if (result) {
        res.send({
          'image': result,
        });
      }
    }).catch((error) => {
      res.status(400).send({
        'code': 400,
        'error': 'BAD_REQUEST',
        'message': error.message,
      });
    });
  }

  updateOne(req, res) {
    const userId = req['user'].id;
    const imageId = req.params.id;
    const body = req.body;

    const updatedImage = BodyParser.parseBodyParametersToObject(body, ['description']);

    this.dbClient.imageIsOwnedByUser(userId, imageId).then(() => {
      this.dbClient.updateOneImage(imageId, { $set: updatedImage }).then(() => {
        res.send({
          'message': 'Image updated successfully.',
        });
      });
    }).catch((error) => {
      res.status(400).send({
        'code': 400,
        'error': 'BAD_REQUEST',
        'message': error.message,
      });
    });
  }

  deleteOne(req, res) {
    const userId = req['user'].id;
    const imageId = req.params.id;

    this.imageService.deleteImage(imageId, userId).then(() => {
      res.send({
        'message': 'Image deleted successfully.',
      });
    }).catch((error) => {
      res.status(400).send({
        'code': 400,
        'error': 'BAD_REQUEST',
        'message': error.message,
      });
    });
  }
}
