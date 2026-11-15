// lib/store.js — In-memory store (replace with DB adapter in production)
// Supabase: npm install @supabase/supabase-js
// Neon:    npm install @neondatabase/serverless

let _schedule = require('../data-server.js').SCHEDULE;
let _rooms    = require('../data-server.js').ROOMS;
let _announcements = require('../data-server.js').ANNOUNCEMENTS;

module.exports = {
  // Rooms
  getRooms: () => _rooms,
  getRoom: (id) => _rooms.find(r => r.id === id),
  addRoom: (room) => { _rooms.push(room); return room; },
  updateRoom: (id, patch) => {
    const idx = _rooms.findIndex(r => r.id === id);
    if (idx < 0) return null;
    _rooms[idx] = { ..._rooms[idx], ...patch };
    return _rooms[idx];
  },

  // Schedule
  getSchedule: (day) => day ? _schedule.filter(s => s.day === day) : _schedule,
  getEntry: (id) => _schedule.find(s => s.id === id),
  addEntry: (entry) => {
    const newEntry = { id: Date.now(), ...entry };
    _schedule.push(newEntry);
    return newEntry;
  },
  updateEntry: (id, patch) => {
    const idx = _schedule.findIndex(s => s.id === id);
    if (idx < 0) return null;
    _schedule[idx] = { ..._schedule[idx], ...patch };
    return _schedule[idx];
  },
  deleteEntry: (id) => {
    const idx = _schedule.findIndex(s => s.id === id);
    if (idx < 0) return false;
    _schedule.splice(idx, 1);
    return true;
  },
  hasConflict: (roomId, day, start, end, excludeId) => {
    const t2m = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    return _schedule.some(s =>
      s.roomId === roomId && s.day === day &&
      t2m(s.start) < t2m(end) && t2m(s.end) > t2m(start) &&
      s.id !== excludeId
    );
  },

  // Announcements
  getAnnouncements: () => _announcements,
  addAnnouncement: (ann) => {
    const a = { id: Date.now(), created: new Date().toISOString().split('T')[0], ...ann };
    _announcements.push(a); return a;
  },
  deleteAnnouncement: (id) => {
    const idx = _announcements.findIndex(a => a.id === id);
    if (idx < 0) return false;
    _announcements.splice(idx, 1); return true;
  },
};
