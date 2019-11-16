const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        resolve(res);
      }).catch(() => {
        reject(new Error('Authentication failed.'));
      });
    });
  }

  generateHash(password) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return reject(err);
        }
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            return reject(err);
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
      jwt.verify(token, this.secret, { algorithm: 'HS256' }, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve({ id: decoded.sub });
        }
      });
    });
  }
}

module.exports = AuthService;
