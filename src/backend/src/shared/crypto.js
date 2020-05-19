const crypto = require('crypto');

const bcrypt = require('bcryptjs');

function generateKey() {
  const buffer = crypto.randomBytes(21);
  return buffer.toString('base64');
}

function generateHash(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 12)
      .then((hash) => resolve(hash))
      .catch((error) => reject(error));
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
