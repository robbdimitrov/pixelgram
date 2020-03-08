const Router = require('express').Router;

module.exports = function (imageController) {
  const router = Router();

  router.get('/', imageController.getImages);

  return router;
};
