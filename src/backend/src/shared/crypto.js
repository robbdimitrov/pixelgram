const crypto = require('crypto');

const argon2 = require('argon2');

function generateKey() {
  return crypto.randomBytes(21).toString('base64');
}

function generateHash(password) {
  return argon2.hash(password);
}

function verifyPassword(password, passwordHash) {
  return argon2.verify(passwordHash, password);
}

module.exports = {
  generateKey,
  generateHash,
  verifyPassword
};
