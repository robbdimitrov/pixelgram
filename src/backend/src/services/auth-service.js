const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Logger = require('../tools/logger');

class AuthService {
  constructor(secret) {
    this.secret = secret;
  }

  validatePassword(password, passwordHash) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, passwordHash).then((result) => {
        resolve(result);
      }).catch((error) => {
        Logger.logError(`Error validating password: ${error}`);
        reject(error);
      });
    });
  }

  generateHash(password) {
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

  generateToken(user) {
    const options = { algorithm: 'HS256', expiresIn: '12h' };
    const payload = { sub: user.id };
    const token = jwt.sign(payload, this.secret, options);
    return token;
  }

  validateToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, { algorithm: 'HS256' }, (error, result) => {
        if (error) {
          Logger.logError(`Error validating token: ${error}`);
          reject(new Error('Failed to authenticate token.'));
        } else {
          resolve({ id: result.sub });
        }
      });
    });
  }
}

module.exports = AuthService;
