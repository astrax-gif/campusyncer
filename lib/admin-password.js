const fs = require('fs');
const os = require('os');
const path = require('path');
const { hashPassword, verifyPassword } = require('./password-hash');

const STORE_FILE = process.env.ADMIN_PASSWORD_STORE_FILE || path.join(os.homedir(), '.ue-portal', 'admin-password.json');
const INITIAL_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2026';
const initialRecord = { ...hashPassword(INITIAL_PASSWORD), updatedAt: 0 };

function readOverride() {
  try {
    const record = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    if (!record || typeof record.salt !== 'string' || typeof record.passwordHash !== 'string' || !Number.isFinite(record.updatedAt))
      throw new Error('Administrator password data is invalid.');
    return record;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function verify(password) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const record = readOverride() || initialRecord;
  return verifyPassword(password, record.salt, record.passwordHash);
}

function update(password) {
  const dir = path.dirname(STORE_FILE);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const record = { ...hashPassword(password), updatedAt: Date.now() };
  const tempFile = `${STORE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(record), { mode: 0o600 });
  fs.renameSync(tempFile, STORE_FILE);
  return record.updatedAt;
}

function changedAt() {
  const record = readOverride();
  return record ? record.updatedAt : 0;
}

module.exports = { changedAt, update, verify };
