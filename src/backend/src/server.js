const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');

const ImageRouter = require('./routers/image-router');
const SessionRouter = require('./routers/session-router');
const UploadRouter = require('./routers/upload-router');
const UserRouter = require('./routers/user-router');
const ImageService = require('./services/image-service');
const UserService = require('./services/user-service');
const authChecker = require('./routers/auth-checker');
const Logger = require('./services/logger');

class Server {
  constructor(port, userClient, imageClient, imageDir) {
    this.port = port;
    this.userClient = userClient;
    this.imageClient = imageClient;
    this.imageDir = imageDir;
    this.routers = {};
    this.app = express();

    this.userService = new UserService(userClient);
    this.imageService = new ImageService(imageClient);
  }

  // Configure Express middleware
  configure() {
    this.configureLogger();
    this.app.use(bodyParser.json());
    this.app.use(helmet());
    this.configureCors();
    this.configureRoutes();
    this.connectRoutes();
    this.configureStatic();
  }

  configureLogger() {
    this.app.use((req, res, next) => {
      Logger.logInfo(`Server request ${req.method} ${req.url}`);
      next();
    });
  }

  configureStatic() {
    this.app.use('/uploads', express.static(this.imageDir));
  }

  configureCors() {
    if (process.env.NODE_ENV) {
      return;
    }

    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
      res.header('Access-Control-Allow-Headers', 'Origin, Authorization, Content-Type, Accept');
      next();
    });
  }

  // Create API routers
  configureRoutes() {
    const sessionRouter = new SessionRouter(this.dbClient);
    this.routers.sessions = sessionRouter;

    const userRouter = new UserRouter(this.dbClient, this.userService, this.imageService);
    this.routers.users = userRouter;

    const imageRouter = new ImageRouter(this.dbClient, this.imageService);
    this.routers.images = imageRouter;

    const uploadRouter = new UploadRouter(this.imageDir);
    this.routers.upload = uploadRouter;
  }

  // Configure API endpoints
  connectRoutes() {
    this.app.use(authChecker);

    // Create and map express routers
    for (const key in this.routers) {
      if (Object.prototype.hasOwnProperty.call(this.routers, key)) {
        const value = this.routers[key];
        this.app.use(`/${key}`, value.router);
      }
    }
  }

  // Setup state and start server
  start() {
    this.configure();

    this.server = this.app.listen(this.port, () => {
      Logger.logInfo(`Starting server on port ${this.port}`);
    });

    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
  }

  // Stop server, close database connection
  shutdown() {
    Logger.logInfo('Shutting down...');

    this.server.close((error) => {
      if (error) {
        Logger.logError(`Closing server failed: ${error}`);
      }
    });

    this.userClient.close();
    this.imageClient.close();
  }
}

module.exports = Server;
