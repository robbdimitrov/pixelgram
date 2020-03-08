const Router = require('express').Router;

module.exports = function (sessionCotroller) {
  const router = Router();

  router.post('/', sessionCotroller.createSession);
  router.delete('/:sessionId', sessionCotroller.deleteSession);

  return router;
};
