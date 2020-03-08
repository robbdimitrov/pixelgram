const allowedRoutes = [
  { method: 'OPTIONS', path: '/' },
  { method: 'POST', path: '/sessions' },
  { method: 'POST', path: '/users' },
  { method: 'GET', path: '/uploads' }
];

function isAllowed(req) {
  for (const route of allowedRoutes) {
    if (req.method === route.method && req.path.includes(route.path)) {
      return true;
    }
  }
  return false;
}

module.exports = function (sessionController) {
  return function (req, res, next) {
    if (isAllowed(req)) {
      return next();
    }
    sessionController.validateSession(req, res);
  };
};
