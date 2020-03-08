const Router = require('express').Router;

module.exports = function (imageController) {
  const router = Router();

  router.post('/', imageController.likeImage);
  router.get('/', imageController.getImagesLikedByUser);
  router.delete('/:imageId', imageController.unlikeImage);

  return router;
};
