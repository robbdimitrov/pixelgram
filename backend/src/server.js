import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';

import { ImageRouter } from './routers/image-router';
import { SessionRouter } from './routers/session-router';
import { UploadRouter } from './routers/upload-router';
import { UserRouter } from './routers/user-router';
import { AuthService } from './services/auth-service';
import { ImageService } from './services/image-service';
import { UserService } from './services/user-service';

export class Server {
  constructor(dbClient) {
    this.dbClient = dbClient;

    this.app = express();
    this.imageDir = '/data/images';
    this.routers = {};
    this.imageService = new ImageService(dbClient);
    this.userService = new UserService(dbClient);
    this.configure();
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
      process.stdout.write(`[${process.env.NODE_ENV}] REQUEST ${req.method} ${req.url}\n`);
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

    let token = req.headers['x-access-token'];

    // decode token
    if (token) {
      // verifies secret and checks exp
      AuthService.getInstance().validateToken(token).then((result) => {
        req.user = result;
        next();
      }).catch(() => {
        res.status(401).send({
          'code': 401,
          'error': 'INVALID_TOKEN',
          'message': 'Failed to authenticate token.',
        });
      });
    } else {
      // if there is no token
      // return an error
      res.status(401).send({
        'code': 401,
        'error': 'INVALID_TOKEN',
        'message': 'No token provided.',
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
    this.app.use(this.authChecker);

    // Create and map express routers
    for (let key in this.routers) {
      if (this.routers.hasOwnProperty(key)) {
        let value = this.routers[key];
        this.app.use(`/api/${key}`, value.router);
      }
    }
  }

  // Connect to database and start listening to port
  start() {
    this.app.listen(3000, () => {
      process.stdout.write('We are live on 3000\n');
    });
  }
}
