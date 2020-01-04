const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Logger = require('./logger');

class AuthService {
  constructor() {
    this.secret = process.env.SECRET;
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  validatePassword(password, passwordHash) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, passwordHash).then((res) => {
        if (res) {
          return resolve();
        }
        reject(new Error('Authentication failed.'));
      }).catch((error) => {
        Logger.logError(`Error validating password: ${error}`);
        reject(new Error('Authentication failed.'));
      });
    });
  }

  generateHash(password) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (error, salt) => {
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
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiration = issuedAt + 60 * 60;
    const payload = {
      sub: user._id,
      iat: issuedAt,
      exp: expiration
    };
    const token = jwt.sign(payload, this.secret, { algorithm: 'HS256' });
    return token;
  }

  validateToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, { algorithm: 'HS256' }, (error, decoded) => {
        if (error) {
          Logger.logError(`Error validating token: ${error}`);
          reject(new Error('Failed to authenticate token.'));
        } else {
          resolve({ id: decoded.sub });
        }
      });
    });
  }
}

module.exports = AuthService;
