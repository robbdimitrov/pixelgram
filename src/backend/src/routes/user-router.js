const Router = require('express').Router;

module.exports = function (userController, imageController) {
  const router = Router();

  router.post('/', (req, res) => userController.createUser(req, res));
  router.get('/:userId', (req, res) => userController.getUser(req, res));
  router.put('/:userId', (req, res) => userController.updateUser(req, res));
  router.get('/:userId/images', (req, res) => imageController.getImagesByUser(req, res));
  router.get('/:userId/likes', (req, res) => imageController.getImagesLikedByUser(req, res));

  return router;
};
