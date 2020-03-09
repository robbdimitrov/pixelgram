const cookie = require('cookie');

module.exports = function (req, res, next) {
  if (req.cookies) {
    return next();
  }

  const cookies = req.header('Cookie');

  if (!cookies) {
    req.cookies = {};
    return next();
  }

  req.cookies = cookie.parse(cookies);
  next();
};
