import { Router } from 'express';

export class APIRouter {
  constructor(dbClient, options) {
    this.router = Router(options);
    this.dbClient = dbClient;
    this.subrouters = {};

    this.connectRouter(this.router);
  }

  setupSubrouters() {
    for (const key in this.subrouters) {
      if (this.subrouters.hasOwnProperty(key)) {
        const value = this.subrouters[key];
        this.router.use(`/:parentId/${key}`, value.router);
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
    router.get('/:id', (req, res) => {
      this.getOne(req, res);
    });

    // Edit specific object
    router.put('/:id', (req, res) => {
      this.updateOne(req, res);
    });

    // Delete specific object
    router.delete('/:id', (req, res) => {
      this.deleteOne(req, res);
    });
  }

  // Helpers

  sendNotFound(res) {
    res.status(404).send({
      code: 404,
      error: 'NOT_FOUND',
      message: 'The resource was not found.',
    });
  }

  // Router functions

  // Get all objects
  getAll(req, res) {
    this.sendNotFound(res);
  }

  // Create a new object
  createOne(req, res) {
    this.sendNotFound(res);
  }

  // Get an object
  getOne(req, res) {
    this.sendNotFound(res);
  }

  // Update existing object
  updateOne(req, res) {
    this.sendNotFound(res);
  }

  // Delete existing object
  deleteOne(req, res) {
    this.sendNotFound(res);
  }
}
