import crypto from 'crypto';

import argon2 from 'argon2';

function generateKey() {
  return crypto.randomBytes(21).toString('base64');
}

function generateHash(password: string) {
  return argon2.hash(password);
}

function verifyPassword(password: string, passwordHash: any) {
  return argon2.verify(passwordHash, password);
}

export {
  generateKey,
  generateHash,
  verifyPassword
};
