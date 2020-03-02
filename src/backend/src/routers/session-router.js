const APIRouter = require('./api-router');
const StatusCode = require('./status-code');

class SessionRouter extends APIRouter {
  constructor(dbClient, options, authService) {
    super(dbClient, options);

    this.authService = authService;
  }

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

    const authFailedBlock = () => {
      res.status(StatusCode.unauthorized).send({
        error: {
          code: StatusCode.unauthorized,
          message: 'Authentication failed. Incorrect email or password.'
        }
      });
    };

    this.dbClient.getUserCredentials('email', body.email).then((user) => {
      if (!user) {
        return authFailedBlock();
      }

      this.authService.validatePassword(body.password, user['password'])
        .then((valid) => {
          if (!valid) {
            return authFailedBlock();
          }

          delete user['password'];
          const token = this.authService.generateToken(user);
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
