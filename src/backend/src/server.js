const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');

const ImageRouter = require('./routers/image-router');
const SessionRouter = require('./routers/session-router');
const UploadRouter = require('./routers/upload-router');
const UserRouter = require('./routers/user-router');
const ImageService = require('./services/image-service');
const UserService = require('./services/user-service');
const authChecker = require('./services/auth-checker');
const Logger = require('./services/logger');

class Server {
  constructor(port, dbClient, imageDir) {
    this.port = port;
    this.dbClient = dbClient;
    this.imageDir = imageDir;
    this.routers = {};
    this.app = express();

    this.imageService = new ImageService(dbClient);
    this.userService = new UserService(dbClient);
  }

  // Configure Express middleware
  configure() {
    this.configureLogger();
    this.app.use(bodyParser.json());
    this.app.use(helmet());
    this.configureRoutes();
    this.connectRoutes();
    this.configureStatic();
  }

  configureLogger() {
    this.app.use((req, res, next) => {
      Logger.logInfo(`Server REQUEST ${req.method} ${req.url}`);
      next();
    });
  }

  configureStatic() {
    this.app.use('/api/uploads', express.static(this.imageDir));
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
        this.app.use(`/api/${key}`, value.router);
      }
    }
  }

  // Setup state and start server
  start() {
    this.configure();

    this.app.listen(this.port, () => {
      Logger.logInfo(`Starting server on port ${this.port}`);
    });
  }
}

module.exports = Server;
