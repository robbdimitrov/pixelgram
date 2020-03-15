const Router = require('express').Router;

module.exports = function (imageController) {
  const router = Router();

  router.post('/', (req, res) => imageController.createImage(req, res));
  router.get('/', (req, res) => imageController.getImages(req, res));
  router.get('/:imageId', (req, res) => imageController.getImage(req, res));
  router.delete('/:imageId', (req, res) => imageController.deleteImage(req, res));
  router.post('/:imageId/likes', (req, res) => imageController.likeImage(req, res));
  router.delete('/:imageId/likes', (req, res) => imageController.unlikeImage(req, res));

  return router;
};
