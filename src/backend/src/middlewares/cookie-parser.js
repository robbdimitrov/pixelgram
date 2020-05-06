const cookie = require('cookie');

module.exports = function (req, res, next) {
  if (req.cookies) {
    return next();
  }
  const cookies = req.header('cookie');
  req.cookies = cookies ? cookie.parse(cookies) : {};
  next();
};
