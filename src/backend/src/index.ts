import express from 'express';
import helmet from 'helmet';

import authGuard from './middlewares/auth-guard';
import cookieParser from './middlewares/cookie-parser';
import trim from './middlewares/trim';
import { logInfo } from './shared/logger';

import AuthController from './controllers/auth-controller';
import ImageController from './controllers/image-controller';
import UploadController from './controllers/upload-controller';
import UserController from './controllers/user-controller';
import router from './router';
import { Request, Response, NextFunction } from 'express';
import DbClient from './db';

function configureRoutes(app: any, imageDir: string, controllers: any) {
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
  app.use(express.json());
  app.use(trim);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    logInfo(`Request ${req.method} ${req.url}`);
    next();
  });

  const controllers = {
    auth: new AuthController(dbClient),
    image: new ImageController(dbClient),
    upload: (UploadController as any)(imageDir, dbClient),
    user: new UserController(dbClient)
  };

  configureRoutes(app, imageDir, controllers);

  return app;
}
