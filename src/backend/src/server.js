const express = require('express');
const helmet = require('helmet');

const DbClient = require('./db/db-client');
const ImageController = require('./controllers/image-controller');
const SessionController = require('./controllers/session-controller');
const UserController = require('./controllers/user-controller');

const authGuard = require('./middlewares/auth-guard');
const cookieParser = require('./middlewares/cookie-parser');

const imageRouter = require('./routes/image-router');
const sessionRouter = require('./routes/session-router');
const userRouter = require('./routes/user-router');
const uploadRouter = require('./routes/upload-router');

const logger = require('./shared/logger');

class Server {
  constructor(port, dbUrl, imageDir) {
    this.port = port;
    this.imageDir = imageDir;

    this.app = express();

    this.dbClient = new DbClient(dbUrl);
    this.imageController = new ImageController(this.dbClient);
    this.sessionController = new SessionController(this.dbClient);
    this.userController = new UserController(this.dbClient);
  }

  // Configure middleware
  configure() {
    this.app.use(helmet());
    this.app.use(express.json());
    this.configureLogger();
    this.configureRoutes();
    this.configureStatic();
    this.configureNotFound();
  }

  configureLogger() {
    this.app.use((req, res, next) => {
      logger.logInfo(`Server request ${req.method} ${req.url}`);
      next();
    });
  }

  // Configure routes
  configureRoutes() {
    // Middleware
    this.app.use(cookieParser);
    this.app.use(authGuard(this.sessionController));

    // Routers
    this.app.use('/images', imageRouter(this.imageController));
    this.app.use('/sessions', sessionRouter(this.sessionController));
    this.app.use('/users', userRouter(this.userController, this.imageController));
    this.app.use('/uploads', uploadRouter(this.imageDir));
  }

  configureStatic() {
    this.app.use('/uploads', express.static(this.imageDir));
  }

  configureNotFound() {
    this.app.use((req, res, next) => {
      res.status(404).send({
        message: 'Resource not found.'
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
