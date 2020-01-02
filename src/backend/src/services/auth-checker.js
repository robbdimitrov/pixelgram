const AuthService = require('./auth-service');
const StatusCode = require('../routers/status-code');
const Logger = require('./logger');

const allowed = [
  {
    method: 'OPTIONS',
    path: ''
  },
  {
    method: 'POST',
    path: '/sessions'
  },
  {
    method: 'POST',
    path: '/users'
  }
];

function isAllowed(req) {
  for (const route in allowed) {
    if (req.method === route.method && req.path.indexOf(route.path) !== -1) {
      return true;
    }
  }
  return false;
}

function authChecker(req, res, next) {
  // If this is a login request, create a user request or
  // get an image request, don't check for token
  if (isAllowed(req)) {
    return next();
  }

  const token = req.get('Authorization');

  // decode token
  if (token) {
    // verifies secret and checks exp
    AuthService.getInstance().validateToken(token).then((result) => {
      req.user = result;
      next();
    }).catch((error) => {
      Logger.logError(`Token validation failed: ${error}`);

      res.status(StatusCode.unauthorized).send({
        error: {
          code: StatusCode.unauthorized,
          message: 'Failed to authenticate token.'
        }
      });
    });
  } else {
    // if there is no token
    // return an error
    res.status(StatusCode.unauthorized).send({
      error: {
        code: StatusCode.unauthorized,
        message: 'No token provided.'
      }
    });
  }
}

export default authChecker;
