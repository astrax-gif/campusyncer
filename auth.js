// lib/auth.js — HMAC-signed session tokens (no JWT dependency needed)
const crypto = require('crypto');

const SECRET = process.env.ADMIN_SECRET || 'dev-secret-change-in-production';
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function sign(payload) {
  const data = JSON.stringify({ ...payload, iat: Date.now() });
  const b64  = Buffer.from(data).toString('base64url');
  const sig  = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verify(token) {
  if (!token) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
  if (Date.now() - payload.iat > TTL_MS) return null; // expired
  return payload;
}

function requireAdmin(req, res) {
  const token = req.headers['x-admin-token'] || req.cookies?.adminToken;
  const payload = verify(token);
  if (!payload || payload.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { sign, verify, requireAdmin };
