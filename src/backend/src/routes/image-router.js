const Router = require('express').Router;

module.exports = function (imageController) {
  const router = Router();

  router.post('/', imageController.createImage);
  router.get('/', imageController.getImagesByUser);
  router.get('/:imageId', imageController.getImage);
  router.delete('/:imageId', imageController.deleteImage);

  return router;
};
