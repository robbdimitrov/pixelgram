const allowed = [
  {method: 'POST', path: '/sessions'},
  {method: 'DELETE', path: '/sessions'},
  {method: 'POST', path: '/users'}
];

function isAllowed(req) {
  if (req.method === 'OPTIONS') {
    return true;
  }
  for (const route of allowed) {
    if (req.method === route.method && req.path === route.path) {
      return true;
    }
  }
  return false;
}

module.exports = function (controller) {
  return function (req, res, next) {
    if (isAllowed(req)) {
      return next();
    }
    controller.validateSession(req, res, next);
  };
};
