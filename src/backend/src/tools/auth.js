const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Logger = require('./logger');

const secret = process.env.SECRET;

function validatePassword(password, passwordHash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, passwordHash).then((res) => {
      resolve(res);
    }).catch((error) => {
      Logger.logError(`Error validating password: ${error}`);
      reject(new Error('Authentication failed.'));
    });
  });
}

function generateHash(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (error, salt) => {
      if (error) {
        Logger.logError(`Error generating hash: ${error}`);
        return reject(error);
      }
      bcrypt.hash(password, salt, (error, hash) => {
        if (error) {
          Logger.logError(`Error generating hash: ${error}`);
          return reject(error);
        }
        resolve(hash);
      });
    });
  });
}

function generateToken(user) {
  const options = { algorithm: 'HS256', expiresIn: '12h' };
  const payload = { sub: user.id };
  const token = jwt.sign(payload, secret, options);
  return token;
}

function validateToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, { algorithm: 'HS256' }, (error, decoded) => {
      if (error) {
        Logger.logError(`Error validating token: ${error}`);
        reject(new Error('Failed to authenticate token.'));
      } else {
        resolve({ id: decoded.sub });
      }
    });
  });
}

module.exports = {
  validatePassword,
  generateHash,
  generateToken,
  validateToken
};
