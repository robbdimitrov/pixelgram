const Router = require('express').Router;

const StatusCode = require('./status-code');
const Logger = require('../services/logger');

class APIRouter {
  constructor(dbClient, options) {
    this.router = Router(options);
    this.dbClient = dbClient;
    this.subrouters = {};

    this.connectRouter(this.router);
  }

  setupSubrouters() {
    for (const key in this.subrouters) {
      if (Object.prototype.hasOwnProperty.call(this.subrouters, key)) {
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

  sendNotFound(req, res) {
    Logger.logError(`Resource not found ${req.method} ${req.path}`);

    res.status(StatusCode.notFound).send({
      error: {
        code: StatusCode.notFound,
        message: 'The resource was not found.'
      }
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

module.exports = APIRouter;
