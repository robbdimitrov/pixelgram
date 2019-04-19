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
    router.get('/', (req, res) => {
      this.getAll(req, res);
    });

    // Post new object
    router.post('/', (req, res) => {
      this.createOne(req, res);
    });

    // Get specific object
    router.get(`/:id(${this.validationRegex})`, (req, res) => {
      this.getOne(req, res);
    });

    // Edit specific object
    router.put(`/:id(${this.validationRegex})`, (req, res) => {
      this.updateOne(req, res);
    });

    // Delete specific object
    router.delete(`/:id(${this.validationRegex})`, (req, res) => {
      this.deleteOne(req, res);
    });
  }

  // Helpers

  sendNotFound(req, res) {
    res.status(404).send({
      'code': 404,
      'error': 'NOT_FOUND',
      'message': 'The resource was not found.',
    });
  }

  // Router functions

  // Get all objects
  getAll(req, res) {
    this.sendNotFound(req, res);
  }

  // Create a new object
  createOne(req, res) {
    this.sendNotFound(req, res);
  }

  // Get an object
  getOne(req, res) {
    this.sendNotFound(req, res);
  }

  // Update existing object
  updateOne(req, res) {
    this.sendNotFound(req, res);
  }

  // Delete existing object
  deleteOne(req, res) {
    this.sendNotFound(req, res);
  }
}
