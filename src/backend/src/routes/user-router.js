const Router = require('express').Router;

module.exports = function (userController) {
  const router = Router();

  router.post('/', userController.createUser);
  router.get('/:userId', userController.getUser);
  router.put('/:userId', userController.updateUser);
  router.delete('/:userId', userController.deleteUser);

  return router;
}
