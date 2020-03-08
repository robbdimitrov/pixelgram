const Router = require('express').Router;

module.exports = function (userController) {
  const router = Router();

  router.post('/', userController.createUser);
  router.get('/:userId', userController.getUser);
  router.put('/:userId', userController.updateUser);

  return router;
};
