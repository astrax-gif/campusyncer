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
