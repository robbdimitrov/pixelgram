const bcrypt = require('bcryptjs');

// TODO: add key generation

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
  generateHash,
  validatePassword
}
