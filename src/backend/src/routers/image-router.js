const APIRouter = require('./api-router');
const ImageLikesRouter = require('./image-likes-router');

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

  getOne(req, res) {
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

  deleteOne(req, res) {
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
}

module.exports = ImageRouter;
