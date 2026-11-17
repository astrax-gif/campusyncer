const handler = require('../../lib/http');

module.exports = handler({
  POST(req, res) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `adminToken=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
    res.json({ loggedOut: true });
  },
});
