import { APIRouter } from './api-router';
import { UserImagesRouter } from './user-images-router';
import { UserLikesRouter } from './user-likes-router';

export class UserRouter extends APIRouter {
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
    const limit = parseInt(query.limit, 10) || 25;
    const page = parseInt(query.page, 10) || 0;

    this.dbClient.getAllUsers({}, page, limit).then((result) => {
      res.send({
        users: result,
      });
    }).catch((error) => {
      res.status(400).send({
        code: 400,
        error: 'BAD_REQUEST',
        message: error.message,
      });
    });
  }

  createOne(req, res) {
    const body = req.body || {};

    if (body.name === undefined || body.username === undefined ||
            body.email === undefined || body.password === undefined) {

      const error = new Error('Missing argument(s). Name, username, email and password are expected.');
      return res.status(400).send({
        code: 400,
        error: 'BAD_REQUEST',
        message: error.message,
      });
    }

    const name = body.name || '';
    const username = body.username || '';
    const email = body.email || '';
    const password = body.password || '';

    this.userService.createUser(name, username, email, password).then(() => {
      res.send({
        message: 'User created.',
      });
    }).catch((error) => {
      res.status(400).send({
        code: 400,
        error: 'BAD_REQUEST',
        message: error.message,
      });
    });
  }

  getOne(req, res) {
    const id = req.params.id;

    this.dbClient.getOneUser('id', id).then((result) => {
      if (result) {
        res.send({
          user: result,
        });
      }
    }).catch((error) => {
      res.status(400).send({
        code: 400,
        error: 'BAD_REQUEST',
        message: error.message,
      });
    });
  }

  updateOne(req, res) {
    const userId = req.params.id;
    const body = req.body;

    if (userId !== req.user.id) {
      return res.status(403).send({
        code: 403,
        error: 'FORBIDDEN',
        message: 'Can\'t update other people\'s accounts.',
      });
    }

    if (Object.keys(body).length < 1) {
      return res.send({
        message: 'Nothing to update.',
      });
    }

    this.userService.updateUser(userId, body).then(() => {
      res.send({
        message: 'User updated.',
      });
    }).catch((error) => {
      res.status(400).send({
        code: 400,
        error: 'BAD_REQUEST',
        message: error.message,
      });
    });
  }

  deleteOne(req, res) {
    const id = req.params.id;

    if (id !== req.user.id) {
      return res.status(403).send({
        code: 403,
        error: 'FORBIDDEN',
        message: 'Can\'t delete other people\'s accounts.',
      });
    }

    this.dbClient.deleteOneUser(id).then(() => {
      res.send({
        message: 'User deleted.',
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
