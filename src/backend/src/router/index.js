const Router = require('express').Router;

module.exports = function ({session, user, image, upload}) {
  const router = Router();

  // Sessions
  router.post('/sessions', (req, res) => session.createSession(req, res));
  router.delete('/sessions', (req, res) => session.deleteSession(req, res));

  // Users
  router.post('/users', (req, res) => user.createUser(req, res));
  router.get('/users/:userId', (req, res) => user.getUser(req, res));
  router.put('/users/:userId', (req, res) => user.updateUser(req, res));

  // Images
  router.post('/images', (req, res) => image.createImage(req, res));
  router.get('/images', (req, res) => image.getFeed(req, res));
  router.get('/users/:userId/images', (req, res) => image.getImages(req, res));
  router.get('/users/:userId/likes', (req, res) => image.getLikedImages(req, res));
  router.get('/images/:imageId', (req, res) => image.getImage(req, res));
  router.delete('/images/:imageId', (req, res) => image.deleteImage(req, res));
  router.post('/images/:imageId/likes', (req, res) => image.likeImage(req, res));
  router.delete('/images/:imageId/likes', (req, res) => image.unlikeImage(req, res));

  // Upload
  router.post('/uploads', upload.uploader, (req, res) => upload.createFile(req, res));

  return router;
};
