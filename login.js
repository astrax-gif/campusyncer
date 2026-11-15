// api/admin/login.js — POST /api/admin/login
const handler  = require('../../lib/http');
const { sign } = require('../../lib/auth');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2026';

module.exports = handler({
  POST(req, res) {
    const { username, password } = req.body || {};
    if (username !== 'admin' || password !== ADMIN_PASSWORD)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign({ role: 'admin', username: 'admin' });
    // Also set as cookie for browser sessions (httpOnly, sameSite)
    res.setHeader('Set-Cookie', `adminToken=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
    res.json({ token, expiresIn: 28800 });
  },
});
