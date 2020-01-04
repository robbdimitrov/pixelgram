const AuthService = require('../services/auth-service');
const APIRouter = require('./api-router');
const StatusCode = require('./status-code');

class SessionRouter extends APIRouter {
  createOne(req, res) {
    const body = req.body || {};

    if (!body.email || !body.password) {
      return res.status(StatusCode.badRequest).send({
        error: {
          code: StatusCode.badRequest,
          message: 'Missing argument(s). Email and password are required.'
        }
      });
    }

    const email = body.email || '';
    const password = body.password || '';

    const authFailedBlock = () => {
      res.status(StatusCode.unauthorized).send({
        error: {
          code: StatusCode.unauthorized,
          message: 'Authentication failed. Incorrect email or password.'
        }
      });
    };

    this.dbClient.getUser('email', email, true).then((user) => {
      if (!user) {
        return authFailedBlock();
      }

      AuthService.getInstance().validatePassword(password, user['password'])
        .then(() => {
          delete user['password'];
          const token = AuthService.getInstance().generateToken(user);
          res.status(StatusCode.ok).send({
            data: {
              user, token
            }
          });
        })
        .catch(() => {
          authFailedBlock();
        });
    }).catch((error) => {
      res.status(StatusCode.unauthorized).send({
        error: {
          code: StatusCode.unauthorized,
          message: error.message
        }
      });
    });
  }
}

module.exports = SessionRouter;
