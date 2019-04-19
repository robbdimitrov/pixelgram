import { NextFunction, Request, Response, Router } from 'express';

import { DBClient, UserSearchField } from '../services/db-client';
import { ImageService } from '../services/image-service';
import { UserService } from '../services/user-service';
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
    let imagesRouter = new UserImagesRouter(this.dbClient,
      this.imageService, { mergeParams: true });
    this.subrouters['images'] = imagesRouter;

    let likedRouter = new UserLikesRouter(this.dbClient,
      this.imageService, { mergeParams: true });
    this.subrouters['likes'] = likedRouter;
  }

  getAll(req, res, next) {
    let query = req.query || {};
    let limit = parseInt(query.limit, 10) || 25;
    let page = parseInt(query.page, 10) || 0;

    this.dbClient.getAllUsers({}, page, limit).then((result) => {
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
    let body = req.body || {};

    if (body.name === undefined || body.username === undefined ||
            body.email === undefined || body.password === undefined) {

      let error = new Error('Missing argument(s). Name, username, email and password are expected.');
      res.status(400).send({
        'error': error.message,
      });
      return next(error);
    }

    let name = body.name || '';
    let username = body.username || '';
    let email = body.email || '';
    let password = body.password || '';

    this.userService.createUser(name, username, email, password).then((result) => {
      res.send({
        'message': 'User with email ' + email + ' created successfully.',
      });
    }).catch((error) => {
      res.status(400).send({
        'error': error.message,
      });
    });
  }

  getOne(req, res, next) {
    let id = req.params.id;

    this.dbClient.getOneUser(UserSearchField.Identifier, id).then((result) => {
      if (result) {
        res.send({
          'user': result,
        });
      }
    }).catch((error) => {
      res.status(400).send({
        'error': error.message,
      });
    });
  }

  updateOne(req, res, next) {
    let userId = req.params.id;
    let body = req.body;

    if (userId !== req['user'].id) {
      return res.status(403).send({
        'error': 'Can\'t update other people\'s accounts.',
      });
    }

    if (Object.keys(body).length < 1) {
      res.send({
        'message': 'Nothing to update.',
      });
    }

    this.userService.updateUser(userId, body).then((result) => {
      res.send({
        'message': 'User updated successfully.',
      });
    }).catch((error) => {
      res.status(400).send({
        'error': error.message,
      });
    });
  }

  deleteOne(req, res, next) {
    let id = req.params.id;

    if (id !== req['user'].id) {
      return res.status(403).send({
        'error': 'Can\'t delete other people\'s accounts.',
      });
    }

    this.dbClient.deleteOneUser(id).then((result) => {
      res.send({
        'message': 'User deleted successfully.',
      });
    }).catch((error) => {
      res.status(400).send({
        'error': error.message,
      });
    });
  }
}
