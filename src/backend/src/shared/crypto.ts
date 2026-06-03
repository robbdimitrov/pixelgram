import crypto from 'crypto';

import argon2 from 'argon2';

function generateKey() {
  return crypto.randomBytes(21).toString('base64');
}

function sessionHashSecret() {
  return process.env.SESSION_HASH_SECRET || 'pixelgram-development-session-secret';
}

function hashToken(token: string) {
  return crypto.createHmac('sha256', sessionHashSecret()).update(token).digest('hex');
}

function generateHash(password: string) {
  return argon2.hash(password);
}

function verifyPassword(password: string, passwordHash: any) {
  return argon2.verify(passwordHash, password);
}

export {
  generateKey,
  hashToken,
  generateHash,
  verifyPassword
};
