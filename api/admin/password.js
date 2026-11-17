const handler = require('../../lib/http');
const adminPassword = require('../../lib/admin-password');
const { requireAdmin } = require('../../lib/auth');

module.exports = handler({
  POST(req, res) {
    if (!requireAdmin(req, res)) return;
    const { currentPassword, newPassword } = req.body || {};
    if (!adminPassword.verify(currentPassword))
      return res.status(400).json({ error: 'Current password is incorrect.' });
    if (typeof newPassword !== 'string' || newPassword.length < 10 || newPassword.length > 128)
      return res.status(400).json({ error: 'New password must be 10–128 characters.' });

    adminPassword.update(newPassword);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `adminToken=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
    res.json({ updated: true });
  },
});
