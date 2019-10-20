const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');

const ImageRouter = require('./routers/image-router');
const SessionRouter = require('./routers/session-router');
const UploadRouter = require('./routers/upload-router');
const UserRouter = require('./routers/user-router');
const AuthService = require('./services/auth-service');
const ImageService = require('./services/image-service');
const UserService = require('./services/user-service');
const StatusCode = require('./routers/status-code');

class Server {
  constructor(port, dbClient) {
    this.port = port;
    this.dbClient = dbClient;

    this.app = express();
    this.imageDir = '/data/images';
    this.routers = {};
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
      process.stdout.write(`Server REQUEST ${req.method} ${req.url}\n`);
      next();
    });
  }

  configureStatic() {
    this.app.use('/api/uploads', express.static(this.imageDir));
  }

  authChecker(req, res, next) {
    // If this is a login request, create a user request or
    // get an image request, don't check for token
    if (req.method === 'OPTIONS' || (req.method === 'POST' &&
        (req.path.indexOf('/sessions') !== -1 || req.path.indexOf('/users') !== -1)) ||
        (req.method === 'GET' && req.path.indexOf('/uploads') !== -1)) {
      return next();
    }

    const token = req.get('Authorization');

    // decode token
    if (token) {
      // verifies secret and checks exp
      AuthService.getInstance().validateToken(token).then((result) => {
        req.user = result;
        next();
      }).catch(() => {
        res.status(StatusCode.unauthorized).send({
          message: 'Failed to authenticate token.',
        });
      });
    } else {
      // if there is no token
      // return an error
      res.status(StatusCode.unauthorized).send({
        message: 'No token provided.',
      });
    }
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
    this.app.use(this.authChecker);

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
      process.stdout.write(`Starting server on port ${this.port}\n`);
    });
  }
}

module.exports = Server;
