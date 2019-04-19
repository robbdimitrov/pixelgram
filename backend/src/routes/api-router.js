import { Router } from 'express';

export class APIRouter {
  constructor(dbClient, options) {
    this.router = Router(options);
    this.dbClient = dbClient;
    this.subrouters = {};

    // Regex used for single object requests
    this.validationRegex = '[0-9a-zA-Z]+';

    this.connectRouter(this.router);
  }

  setupSubrouters() {
    for (let key in this.subrouters) {
      if (this.subrouters.hasOwnProperty(key)) {
        let value = this.subrouters[key];
        this.router.use(`/:parentId(${this.validationRegex})/${key}`, value.router);
      }
    }
  }

  // Bind routes to router functions

  connectRouter(router) {
    // Get all objects
    router.get('/', (req, res, next) => {
      this.getAll(req, res, next);
    });

    // Post new object
    router.post('/', (req, res, next) => {
      this.createOne(req, res, next);
    });

    // Get specific object
    router.get(`/:id(${this.validationRegex})`, (req, res, next) => {
      this.getOne(req, res, next);
    });

    // Edit specific object
    router.put(`/:id(${this.validationRegex})`, (req, res, next) => {
      this.updateOne(req, res, next);
    });

    // Delete specific object
    router.delete(`/:id(${this.validationRegex})`, (req, res, next) => {
      this.deleteOne(req, res, next);
    });
  }

  // Helpers

  sendNotFound(req, res, next, message = 'Invalid request.') {
    res.status(404).send({
      'error': message,
    });
    next();
  }

  // Router functions

  // Get all objects
  getAll(req, res, next) {
    this.sendNotFound(req, res, next);
  }

  // Create a new object
  createOne(req, res, next) {
    this.sendNotFound(req, res, next);
  }

  // Get an object
  getOne(req, res, next) {
    this.sendNotFound(req, res, next);
  }

  // Update existing object
  updateOne(req, res, next) {
    this.sendNotFound(req, res, next);
  }

  // Delete existing object
  deleteOne(req, res, next) {
    this.sendNotFound(req, res, next);
  }
}
