const express = require('express');
const helmet = require('helmet');

const authGuard = require('./middlewares/auth-guard');
const cookieParser = require('./middlewares/cookie-parser');
const printLog = require('./shared/logger');

const ImageController = require('./controllers/image-controller');
const SessionController = require('./controllers/session-controller');
const UserController = require('./controllers/user-controller');
const UploadController = require('./controllers/upload-controller');
const router = require('./router');

function configureRoutes(app, imageDir, controllers) {
  // Middleware
  app.use(cookieParser);
  app.use(authGuard(controllers.session));

  // Router
  app.use(router(controllers));

  // Static
  app.use('/uploads', express.static(imageDir));

  // Not found
  app.use((req, res, next) => {
    res.status(404).send({
      message: 'Not Found'
    });
  });
}

module.exports = function (dbClient, imageDir) {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  app.use((req, res, next) => {
    printLog(`Request ${req.method} ${req.url}`);
    next();
  });

  const controllers = {
    session: new SessionController(dbClient),
    user: new UserController(dbClient),
    image: new ImageController(dbClient),
    upload: new UploadController(imageDir)
  };

  configureRoutes(app, imageDir, controllers);

  return app;
};
