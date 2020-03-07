const Router = require('express').Router;

module.exports = function (sessionCotroller) {
  const router = Router();

  router.post('/', sessionCotroller.createSession);
  router.get('/', sessionController.getSessions);
  router.delete('/:sessionId', sessionCotroller.deleteSession);

  return router;
}
