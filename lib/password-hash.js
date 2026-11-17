const crypto = require('crypto');

const HASH_BYTES = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, HASH_BYTES).toString('hex');
  return { salt, passwordHash: hash };
}

function verifyPassword(password, salt, passwordHash) {
  if (typeof password !== 'string' || typeof salt !== 'string' || typeof passwordHash !== 'string') return false;
  const actual = crypto.scryptSync(password, salt, HASH_BYTES);
  const expected = Buffer.from(passwordHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
