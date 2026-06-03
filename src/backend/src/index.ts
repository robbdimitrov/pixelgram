import express, { Express, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import authGuard from './middlewares/auth-guard';
import cookieParser from './middlewares/cookie-parser';
import jsonErrorHandler from './middlewares/json-error-handler';
import originGuard from './middlewares/origin-guard';
import trim from './middlewares/trim';
import { logInfo } from './shared/logger';

import AuthController from './controllers/auth-controller';
import ImageController from './controllers/image-controller';
import UploadController from './controllers/upload-controller';
import UserController from './controllers/user-controller';
import router, { Controllers } from './router';
import DbClient from './db';

function configureRoutes(app: Express, imageDir: string, controllers: Controllers) {
  app.use(cookieParser);
  app.use(authGuard(controllers.auth));
  app.use(router(controllers));
  app.use('/uploads', express.static(imageDir));

  app.use((_req: Request, res: Response) => {
    res.status(404).send({
      message: 'Not Found'
    });
  });
}

export default function (dbClient: DbClient, imageDir: string) {
  const app = express();

  app.use(helmet());
  app.use(originGuard);
  app.use(express.json({limit: '100kb'}));
  app.use(jsonErrorHandler);
  app.use(trim);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    logInfo(`Request ${req.method} ${req.url}`);
    next();
  });

  const controllers: Controllers = {
    auth: new AuthController(dbClient),
    image: new ImageController(dbClient),
    upload: UploadController(imageDir, dbClient),
    user: new UserController(dbClient)
  };

  configureRoutes(app, imageDir, controllers);

  return app;
}
