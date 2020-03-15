const Router = require('express').Router;

module.exports = function (sessionCotroller) {
  const router = Router();

  router.post('/', (req, res) => sessionCotroller.createSession(req, res));
  router.delete('/', (req, res) => sessionCotroller.deleteSession(req, res));

  return router;
};
