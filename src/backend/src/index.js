const express = require('express');
const helmet = require('helmet');

const authGuard = require('./middlewares/auth-guard');
const cookieParser = require('./middlewares/cookie-parser');
const {logInfo} = require('./shared/logger');

const AuthController = require('./controllers/auth-controller');
const ImageController = require('./controllers/image-controller');
const UploadController = require('./controllers/upload-controller');
const UserController = require('./controllers/user-controller');
const router = require('./router');

function configureRoutes(app, imageDir, controllers) {
  app.use(cookieParser);
  app.use(authGuard(controllers.auth));
  app.use(router(controllers));
  app.use('/uploads', express.static(imageDir));

  app.use((_req, res, _next) => {
    res.status(404).send({
      message: 'Not Found'
    });
  });
}

module.exports = function (dbClient, imageDir) {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  app.use((req, _res, next) => {
    logInfo(`Request ${req.method} ${req.url}`);
    next();
  });

  const controllers = {
    auth: new AuthController(dbClient),
    image: new ImageController(dbClient),
    upload: new UploadController(imageDir),
    user: new UserController(dbClient)
  };

  configureRoutes(app, imageDir, controllers);

  return app;
};
