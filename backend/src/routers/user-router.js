const APIRouter = require('./api-router');
const UserImagesRouter = require('./user-images-router');
const UserLikesRouter = require('./user-likes-router');
const StatusCode = require('./status-code');

class UserRouter extends APIRouter {
  constructor(dbClient, userService, imageService, options) {
    super(dbClient, options);

    this.userService = userService;
    this.imageService = imageService;

    this.createSubrouters();
    this.setupSubrouters(this.router);
  }

  createSubrouters() {
    const imagesRouter = new UserImagesRouter(this.dbClient,
      this.imageService, { mergeParams: true });
    this.subrouters.images = imagesRouter;

    const likedRouter = new UserLikesRouter(this.dbClient,
      this.imageService, { mergeParams: true });
    this.subrouters.likes = likedRouter;
  }

  getAll(req, res) {
    const query = req.query || {};
    const limit = parseInt(query.limit, 10) || 20;
    const page = parseInt(query.page, 10) || 0;

    this.dbClient.getAllUsers({}, page, limit).then((result) => {
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
    const body = req.body || {};

    if (!body.name || !body.username || !body.email || !body.password) {
      const error = new Error('Missing argument(s). Name, username, email and password are expected.');
      return res.status(StatusCode.badRequest).send({
        message: error.message
      });
    }

    const name = body.name || '';
    const username = body.username || '';
    const email = body.email || '';
    const password = body.password || '';

    this.userService.createUser(name, username, email, password).then((result) => {
      res.status(StatusCode.created).send({
        _id: result
      });
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        message: error.message
      });
    });
  }

  getOne(req, res) {
    const id = req.params.id;

    this.dbClient.getUser('id', id).then((result) => {
      if (result) {
        res.status(StatusCode.ok).send({
          user: result
        });
      }
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        message: error.message
      });
    });
  }

  updateOne(req, res) {
    const userId = req.params.id;
    const body = req.body;

    if (userId !== req.user.id) {
      return res.status(StatusCode.forbidden).send({
        message: 'Can\'t update other people\'s accounts.'
      });
    }

    if (Object.keys(body).length < 1) {
      return res.status(StatusCode.notModified).send({
        message: 'Nothing to update.'
      });
    }

    this.userService.updateUser(userId, body).then(() => {
      res.sendStatus(StatusCode.noContent);
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        message: error.message
      });
    });
  }

  deleteOne(req, res) {
    const id = req.params.id;

    if (id !== req.user.id) {
      return res.status(StatusCode.forbidden).send({
        message: 'Can\'t delete other people\'s accounts.'
      });
    }

    this.dbClient.deleteUser(id).then(() => {
      res.sendStatus(StatusCode.noContent);
    }).catch((error) => {
      res.status(StatusCode.badRequest).send({
        message: error.message
      });
    });
  }
}

module.exports = UserRouter;
