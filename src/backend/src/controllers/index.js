const ImageController = require('./image-controller');
const SessionController = require('./session-controller');
const UserController = require('./user-controller');

module.exports = function (dbClient) {
  return {
    image: new ImageController(dbClient),
    session: new SessionController(dbClient),
    user: new UserController(dbClient)
  };
};
