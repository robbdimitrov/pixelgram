const APIRouter = require('./api-router');
const ImageLikesRouter = require('./image-likes-router');
const StatusCode = require('./status-code');

class ImageRouter extends APIRouter {
  constructor(dbClient, imageService, options) {
    super(dbClient, options);

    this.imageService = imageService;
    this.createSubrouters();
    this.setupSubrouters(this.router);
  }

  createSubrouters() {
    const usersRouter = new ImageLikesRouter(this.dbClient,
      this.imageService, { mergeParams: true });
    this.subrouters.likes = usersRouter;
  }

  getAll(req, res) {
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 0;
    const userId = req.user.id;
    this.imageService.getAllImages(page, limit, userId).then((result) => {
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

  createOne(req, res) {
    const body = req.body || {};

    if (!body.filename) {
      res.status(StatusCode.badRequest).send({
        error: {
          code: StatusCode.badRequest,
          message: 'Missing argument(s). Image filename is expected.'
        }
      });
    }

    const userId = req.user.id;
    const filename = body.filename || '';
    const description = body.description || '';

    this.imageService.createImage(userId, filename, description).then((result) => {
      res.status(StatusCode.created).send({
        data: {
          _id: result
        }
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

  getOne(req, res) {
    const id = req.params.id;
    const userId = req.user.id;

    this.dbClient.getImage(id, userId).then((result) => {
      if (result) {
        res.status(StatusCode.ok).send({
          data: result
        });
      }
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        error: {
          code: StatusCode.badRequest,
          message: error.message
        }
      });
    });
  }

  deleteOne(req, res) {
    const userId = req.user.id;
    const imageId = req.params.id;

    this.imageService.deleteImage(imageId, userId).then(() => {
      res.sendStatus(StatusCode.noContent);
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

module.exports = ImageRouter;
