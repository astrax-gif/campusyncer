// api/admin/schedule.js — POST / PUT / DELETE (admin-protected)
const handler  = require('../../lib/http');
const validate = require('../../lib/http').validate;
const store    = require('../../lib/store');
const { requireAdmin } = require('../../lib/auth');

const RULES = {
  day:       { required: true, in: [1,2,3,4,5] },
  start:     { required: true },
  end:       { required: true },
  roomId:    { required: true },
  course:    { required: true, min: 3 },
  code:      { required: true, min: 3 },
  professor: { required: true },
  program:   { required: true },
};

module.exports = handler({
  POST(req, res) {
    if (!requireAdmin(req, res)) return;
    const errors = validate(req.body, RULES);
    if (errors) return res.status(400).json({ errors });

    const { day, start, end, roomId, course, code, professor, program, semester } = req.body;
    if (store.hasConflict(roomId, day, start, end))
      return res.status(409).json({ error: `Room ${roomId} has a scheduling conflict at that time.` });

    const entry = store.addEntry({ day, start, end, roomId, course, code, professor, program, semester });
    res.status(201).json({ entry });
  },

  PUT(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = parseInt(req.query.id);
    if (!id) return res.status(400).json({ error: 'id required' });
    const errors = validate(req.body, RULES);
    if (errors) return res.status(400).json({ errors });

    const { day, start, end, roomId } = req.body;
    if (store.hasConflict(roomId, day, start, end, id))
      return res.status(409).json({ error: `Room ${roomId} has a scheduling conflict.` });

    const updated = store.updateEntry(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Entry not found' });
    res.json({ entry: updated });
  },

  DELETE(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = parseInt(req.query.id);
    if (!id) return res.status(400).json({ error: 'id required' });
    const ok = store.deleteEntry(id);
    if (!ok) return res.status(404).json({ error: 'Entry not found' });
    res.json({ deleted: true });
  },
});

// api/admin/announcements.js — POST / DELETE /api/admin/announcements
const handler           = require('../../lib/http');
const { validate }      = require('../../lib/http');
const store             = require('../../lib/store');
const { requireAdmin }  = require('../../lib/auth');

const RULES = {
  title:   { required: true, min: 3 },
  msg:     { required: true, min: 5 },
  type:    { required: true, in: ['info', 'warning', 'urgent'] },
  expires: { required: true },
};

module.exports = handler({
  // GET /api/admin/announcements — all announcements (active + expired)
  GET(req, res) {
    if (!requireAdmin(req, res)) return;
    res.json({ announcements: store.getAnnouncements() });
  },

  // POST /api/admin/announcements — create an announcement
  POST(req, res) {
    if (!requireAdmin(req, res)) return;
    const errors = validate(req.body, RULES);
    if (errors) return res.status(400).json({ errors });

    const today = new Date().toISOString().split('T')[0];
    if (req.body.expires < today)
      return res.status(400).json({ error: 'Expiry date must be today or in the future.' });

    const ann = store.addAnnouncement({
      title:   String(req.body.title),
      msg:     String(req.body.msg),
      type:    String(req.body.type),
      expires: String(req.body.expires),
    });
    res.status(201).json({ announcement: ann });
  },

  // DELETE /api/admin/announcements?id=1 — remove an announcement
  DELETE(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = parseInt(req.query.id);
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const ok = store.deleteAnnouncement(id);
    if (!ok) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ deleted: true, id });
  },
});

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

// api/admin/professors.js — GET / POST / PUT / DELETE /api/admin/professors
const handler           = require('../../lib/http');
const { validate }      = require('../../lib/http');
const store             = require('../../lib/store');
const { requireAdmin }  = require('../../lib/auth');

const RULES = {
  name: { required: true, min: 2 },
};

module.exports = handler({
  // GET /api/admin/professors — list all professors with weekly hours
  GET(req, res) {
    if (!requireAdmin(req, res)) return;
    const schedule = store.getSchedule();
    const t2m = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

    const professors = store.getProfessors().map(p => {
      const entries  = schedule.filter(s => s.professor === p.name);
      const courses  = [...new Set(entries.map(s => s.code))];
      const hoursWk  = entries.reduce((acc, s) => acc + (t2m(s.end) - t2m(s.start)) / 60, 0);
      return { ...p, courses, hoursPerWeek: Math.round(hoursWk * 10) / 10 };
    });
    res.json({ professors });
  },

  // POST /api/admin/professors — add a professor
  POST(req, res) {
    if (!requireAdmin(req, res)) return;
    const errors = validate(req.body, RULES);
    if (errors) return res.status(400).json({ errors });

    const { name, dept, email, phone } = req.body;

    if (store.getProfessors().some(p => p.name.toLowerCase() === String(name).toLowerCase()))
      return res.status(409).json({ error: 'A professor with that name already exists.' });

    const prof = store.addProfessor({ name, dept: dept || '', email: email || '', phone: phone || '' });
    res.status(201).json({ professor: prof });
  },

  // PUT /api/admin/professors?id=3 — update a professor
  PUT(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = parseInt(req.query.id);
    if (!id) return res.status(400).json({ error: 'id query param required' });

    const patch = {};
    const b = req.body;
    if (b.name  !== undefined) patch.name  = String(b.name);
    if (b.dept  !== undefined) patch.dept  = String(b.dept);
    if (b.email !== undefined) patch.email = String(b.email);
    if (b.phone !== undefined) patch.phone = String(b.phone);

    const updated = store.updateProfessor(id, patch);
    if (!updated) return res.status(404).json({ error: 'Professor not found' });
    res.json({ professor: updated });
  },

  // DELETE /api/admin/professors?id=3 — remove a professor
  DELETE(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = parseInt(req.query.id);
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const ok = store.deleteProfessor(id);
    if (!ok) return res.status(404).json({ error: 'Professor not found' });
    res.json({ deleted: true, id });
  },
});

// api/admin/rooms.js — POST / PUT / DELETE /api/admin/rooms
const handler           = require('../../lib/http');
const { validate }      = require('../../lib/http');
const store             = require('../../lib/store');
const { requireAdmin }  = require('../../lib/auth');

const RULES = {
  id:       { required: true, min: 1 },
  name:     { required: true, min: 2 },
  floor:    { required: true },
  type:     { required: true },
  capacity: { required: true },
};

module.exports = handler({
  // GET /api/admin/rooms — list all rooms (with maintenance flag)
  GET(req, res) {
    if (!requireAdmin(req, res)) return;
    res.json({ rooms: store.getRooms() });
  },

  // POST /api/admin/rooms — add a new room
  POST(req, res) {
    if (!requireAdmin(req, res)) return;
    const errors = validate(req.body, RULES);
    if (errors) return res.status(400).json({ errors });

    const { id, name, floor, type, capacity, features, maintenance } = req.body;
    const idUpper = String(id).toUpperCase();

    if (store.getRoom(idUpper))
      return res.status(409).json({ error: `Room ${idUpper} already exists.` });

    const room = store.addRoom({
      id:          idUpper,
      name:        String(name),
      floor:       parseInt(floor),
      type:        String(type),
      capacity:    parseInt(capacity),
      features:    Array.isArray(features) ? features : [],
      maintenance: Boolean(maintenance),
    });
    res.status(201).json({ room });
  },

  // PUT /api/admin/rooms?id=R101 — update a room (partial patch)
  PUT(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'id query param required' });

    const patch = {};
    const b = req.body;
    if (b.name        !== undefined) patch.name        = String(b.name);
    if (b.floor       !== undefined) patch.floor       = parseInt(b.floor);
    if (b.type        !== undefined) patch.type        = String(b.type);
    if (b.capacity    !== undefined) patch.capacity    = parseInt(b.capacity);
    if (b.features    !== undefined) patch.features    = Array.isArray(b.features) ? b.features : [];
    if (b.maintenance !== undefined) patch.maintenance = Boolean(b.maintenance);

    const updated = store.updateRoom(id.toUpperCase(), patch);
    if (!updated) return res.status(404).json({ error: 'Room not found' });
    res.json({ room: updated });
  },

  // DELETE /api/admin/rooms?id=R101 — remove a room
  DELETE(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const ok = store.deleteRoom(id.toUpperCase());
    if (!ok) return res.status(404).json({ error: 'Room not found' });
    res.json({ deleted: true, id: id.toUpperCase() });
  },
});
