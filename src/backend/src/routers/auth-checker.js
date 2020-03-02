const allowedRoutes = [
  { method: 'OPTIONS', path: '' },
  { method: 'POST', path: '/sessions' },
  { method: 'POST', path: '/users' },
  { method: 'GET', path: '/uploads' }
];

function isAllowed(req) {
  for (const route of allowedRoutes) {
    if (req.method === route.method && req.path.indexOf(route.path) !== -1) {
      return true;
    }
  }
  return false;
}

function authChecker(authService) {
  return function(req, res, next) {
    // If this is a login request, create a user request or
    // get an image request, don't check for token
    if (isAllowed(req)) {
      return next();
    }

    const token = req.get('Authorization');

    // decode token
    if (token) {
      // verifies secret and checks exp
      authService.validateToken(token).then((result) => {
        req.user = result;
        next();
      }).catch((error) => {
        res.status(401).send({
          message: error.message
        });
      });
    } else {
      // if there is no token
      // return an error
      res.status(401).send({
        message: 'No token provided.'
      });
    }
  };
}

module.exports = authChecker;
