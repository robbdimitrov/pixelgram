const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const DbClient = require('./db');
const ImageController = require('./src/services/image-controller');
const UserController = require('./controllers/user-controller');
const SessionController = require('./controllers/session-controller');
const imageRouter = require('./routes/image-router');
const sessionRouter = require('./routes/session-router');
const userRouter = require('./routes/user-router');
const uploadRouter = require('./routes/upload-router');
const logger = require('./tools/logger');

class Server {
  constructor(port, dbUrl, secret, imageDir) {
    this.port = port;
    this.imageDir = imageDir;

    this.app = express();

    this.dbClient = new DbClient(dbUrl);
    this.imageController = new ImageController(this.dbClient);
    this.sessionCotroller = new SessionController(this.dbClient, secret);
    this.userController = new UserController(this.dbClient, this.sessionCotroller);
  }

  // Configure middleware
  configure() {
    this.app.use(helmet());
    this.app.use(bodyParser.json());
    this.configureLogger();
    this.configureStatic();
    this.configureRoutes();
  }

  configureLogger() {
    this.app.use((req, res, next) => {
      logger.logInfo(`Server request ${req.method} ${req.url}`);
      next();
    });
  }

  configureStatic() {
    this.app.use('/uploads', express.static(this.imageDir));
  }

  // Configure routes
  configureRoutes() {
    this.app.use(authGuard(this.authService));

    this.app.use('/images', imageRouter(this.imageController));
    this.app.use('/sessions', sessionRouter(this.sessionCotroller));
    this.app.use('/users', userRouter(this.userController, this.imageController));
    this.app.use('/uploads', uploadRouter(this.imageDir));

    this.app.use((req, res, next) => {
      res.status(404).send({
        message: 'The resource was not found.'
      });
    });
  }

  // Setup state and start server
  start() {
    this.configure();

    this.server = this.app.listen(this.port, () => {
      logger.logInfo(`Starting server on port ${this.port}`);
    });

    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
  }

  // Stop server, close database connection
  shutdown() {
    logger.logInfo('Shutting down...');

    this.server.close((error) => {
      if (error) {
        logger.logError(`Closing server failed: ${err}`);
      }
    });

    this.dbClient.close();
  }
}

module.exports = Server;
