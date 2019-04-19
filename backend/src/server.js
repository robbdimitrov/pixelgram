import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';

import { ImageRouter } from './routes/image-router';
import { SessionRouter } from './routes/session-router';
import { UploadRouter } from './routes/upload-router';
import { UserRouter } from './routes/user-router';
import { AuthService } from './services/auth-service';
import { ImageService } from './services/image-service';
import { UserService } from './services/user-service';

export class Server {
  constructor(port, apiRoot, imageDir, dbClient) {
    this.port = port;
    this.apiRoot = apiRoot;
    this.imageDir = imageDir;
    this.dbClient = dbClient;

    this.app = express();
    this.routers = {};
    this.imageService = new ImageService(dbClient);
    this.userService = new UserService(dbClient);
    this.configure();
    this.start();
  }

  // Configure Express middleware
  configure() {
    this.configureLogger();
    this.configureBodyParser();
    this.app.use(helmet());
    this.configureRoutes();
    this.connectRoutes();
    this.configureStatic();
  }

  configureBodyParser() {
    this.app.use(bodyParser.urlencoded({extended: true}));
  }

  configureLogger() {
    this.app.use((req, res, next) => {
      process.stdout.write(`[${process.env.NODE_ENV}] REQUST ${req.method} ${req.url}`);
      next();
    });
  }

  configureStatic() {
    this.app.use(`/${this.apiRoot}/uploads`, express.static(this.imageDir));
  }

  authChecker(req, res, next) {
    // If this is a login request, create a user request or
    // get an image request, don't check for token
    if (req.method === 'OPTIONS' || (req.method === 'POST' &&
        (req.path.indexOf('/sessions') !== -1 || req.path.indexOf('/users') !== -1)) ||
        (req.method === 'GET' && req.path.indexOf('/uploads') !== -1)) {
      return next();
    }

    let token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
      // verifies secret and checks exp
      AuthService.getInstance().validateToken(token).then((result) => {
        req.user = result;
        next();
      }).catch(() => {
        return res.status(401).send({
          error: 'Failed to authenticate token.',
        });
      });
    } else {
      // if there is no token
      // return an error
      return res.status(401).send({
        error: 'No token provided.',
      });
    }
  }

  // Create API routers
  configureRoutes() {
    let sessionRouter = new SessionRouter(this.dbClient);
    this.routers['sessions'] = sessionRouter;

    let userRouter = new UserRouter(this.dbClient, this.userService, this.imageService);
    this.routers['users'] = userRouter;

    let imageRouter = new ImageRouter(this.dbClient, this.imageService);
    this.routers['images'] = imageRouter;

    let uploadRouter = new UploadRouter(this.imageDir);
    this.routers['upload'] = uploadRouter;
  }

  // Configure API endpoints
  connectRoutes() {
    let apiRoot = this.apiRoot;

    this.app.use(this.authChecker);

    // Create and map express routers
    for (let key in this.routers) {
      if (this.routers.hasOwnProperty(key)) {
        let value = this.routers[key];
        this.app.use(`/${apiRoot}/${key}`, value.router);
      }
    }
  }

  // Connect to database and start listening to port
  start() {
    this.app.listen(this.port, () => {
      process.stdout.write('We are live on ' + this.port);
    });
  }
}
