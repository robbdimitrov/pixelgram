const crypto = require('crypto');

const bcrypt = require('bcryptjs');

function generateKey() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(21, (error, buffer) => {
      if (error) {
        return reject(error);
      }
      resolve(buffer.toString('base64'));
    });
  });
}

function generateHash(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (error, salt) => {
      if (error) {
        return reject(error);
      }
      bcrypt.hash(password, salt, (error, hash) => {
        if (error) {
          return reject(error);
        }
        resolve(hash);
      });
    });
  });
}

function validatePassword(password, passwordHash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, passwordHash)
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
}

module.exports = {
  generateKey,
  generateHash,
  validatePassword
};
