const AuthService = require('../services/auth-service');
const APIRouter = require('./api-router');

class SessionRouter extends APIRouter {
  createOne(req, res) {
    const body = req.body || {};

    if (!body.email || !body.password) {
      const error = new Error('Missing argument(s). Email and password are required.');
      return res.status(400).send({
        message: error.message,
      });
    }

    const email = body.email || '';
    const password = body.password || '';

    const authFailedBlock = () => {
      res.status(401).send({
        message: 'Authentication failed. Incorrect email or password.',
      });
    };

    this.dbClient.getOneUser('email', email, true).then((user) => {
      if (!user) {
        return authFailedBlock();
      }

      AuthService.getInstance().validatePassword(password, user['password']).then((result) => {
        if (result === true) {
          delete user['password'];
          const token = AuthService.getInstance().generateToken(user);
          res.send({
            user, token
          });
        } else {
          authFailedBlock();
        }
      });
    }).catch((error) => {
      res.status(401).send({
        message: error.message,
      });
    });
  }
}

module.exports = SessionRouter;
