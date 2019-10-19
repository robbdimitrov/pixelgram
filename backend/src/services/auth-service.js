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
        return resolve(res);
      }).catch(() => {
        return reject(new Error('Authentication failed.'));
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
    const payload = { id: user._id };

    const token = jwt.sign(payload, this.secret, {
      expiresIn: '12h',
    });

    return token;
  }

  validateToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
  }
}

module.exports = AuthService;
