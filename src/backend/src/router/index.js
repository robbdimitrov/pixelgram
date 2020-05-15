const Router = require('express').Router;

module.exports = function ({auth, image, upload, user}) {
  const router = Router();

  // Users
  router.post('/users', (req, res) => user.createUser(req, res));
  router.get('/users/:userId', (req, res) => user.getUser(req, res));
  router.put('/users/:userId', (req, res) => user.updateUser(req, res));

  // Sessions
  router.post('/sessions', (req, res) => auth.createSession(req, res));
  router.delete('/sessions', (req, res) => auth.deleteSession(req, res));

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
