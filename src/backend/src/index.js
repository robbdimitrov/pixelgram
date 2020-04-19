const express = require('express');
const helmet = require('helmet');

const authGuard = require('./middlewares/auth-guard');
const cookieParser = require('./middlewares/cookie-parser');

const imageRouter = require('./routes/image-router');
const sessionRouter = require('./routes/session-router');
const userRouter = require('./routes/user-router');
const uploadRouter = require('./routes/upload-router');

const logger = require('./shared/logger');

function configureRoutes(app, imageDir, controllers) {
  // Middleware
  app.use(cookieParser);
  app.use(authGuard(controllers.session));

  // Routers
  app.use('/images', imageRouter(controllers.image));
  app.use('/sessions', sessionRouter(controllers.session));
  app.use('/users', userRouter(controllers.user, controllers.image));
  app.use('/uploads', uploadRouter(imageDir));

  // Static
  app.use('/uploads', express.static(imageDir));

  // Not found
  app.use((req, res, next) => {
    res.status(404).send({
      message: 'Resource not found.'
    });
  });
}

module.exports = function (imageDir, controllers) {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  app.use((req, res, next) => {
    logger.logInfo(`Server request ${req.method} ${req.url}`);
    next();
  });

  configureRoutes(app, imageDir, controllers);

  return app;
};
