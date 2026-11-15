// ═══════════════════════════════════════════════════════════════
// import-schedule.js — turns a normal weekly timetable (PDF, Word,
// Excel, CSV) into portal schedule entries. The admin always reviews
// and can edit everything in a preview before anything is saved.
//
// Pure parsing functions are at the top (also usable from Node for
// tests). Browser UI code is at the bottom.
// ═══════════════════════════════════════════════════════════════
(function (root) {
  'use strict';

  // ─── helpers ─────────────────────────────────────────────────
  const pad = n => String(n).padStart(2, '0');
  const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const DAY_MAP = { mon:1, monday:1, tue:2, tues:2, tuesday:2, wed:3, weds:3, wednesday:3,
                    thu:4, thur:4, thurs:4, thursday:4, fri:5, friday:5, sat:6, saturday:6, sun:7, sunday:7 };
  const dayOf = s => DAY_MAP[String(s == null ? '' : s).trim().toLowerCase().replace(/[^a-z]/g, '')] || 0;
  function findDayIn(text) {
    const m = String(text).match(/\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:s|nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i);
    return m ? { day: dayOf(m[1]), text: m[0] } : null;
  }

  // ─── time ranges: "9:00-11:00", "09.00 – 11.00", "9am to 11am", "11-1pm" ───
  const T_RE = /(\d{1,2})(?:[:.h](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to|until|bis)\s*(\d{1,2})(?:[:.h](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i;
  function parseTimeRange(str, strict) {
    const m = T_RE.exec(String(str));
    if (!m) return null;
    if (strict && !(m[2] || m[5] || m[3] || m[6])) return null; // bare "2-3" in free text is too ambiguous
    const ap = x => (x ? x.replace(/\./g, '').toLowerCase() : '');
    const sa = ap(m[3]), ea = ap(m[6]);
    const c = (h, a) => (a === 'pm' && h < 12 ? h + 12 : (a === 'am' && h === 12 ? 0 : h));
    const sm = +(m[2] || 0), em = +(m[5] || 0);
    let s = c(+m[1], sa), e = c(+m[4], ea);
    if (!sa && ea) { s = c(+m[1], ea); if (s * 60 + sm >= e * 60 + em) s = c(+m[1], ea === 'pm' ? 'am' : 'pm'); }
    else if (!sa && !ea) { if (e * 60 + em <= s * 60 + sm && e < 12) e += 12; if (s < 7) { s += 12; e += 12; } }
    if (s > 23 || e > 23 || sm > 59 || em > 59 || e * 60 + em <= s * 60 + sm) return null;
    return { start: `${pad(s)}:${pad(sm)}`, end: `${pad(e)}:${pad(em)}`, text: m[0] };
  }
  function parseSingleTime(str) {
    const m = /^\s*(\d{1,2})[:.](\d{2})\s*(a\.?m\.?|p\.?m\.?)?\s*$/i.exec(String(str));
    if (!m) return null;
    let h = +m[1]; const a = (m[3] || '').replace(/\./g, '').toLowerCase();
    if (a === 'pm' && h < 12) h += 12; if (a === 'am' && h === 12) h = 0;
    return h < 24 && +m[2] < 60 ? `${pad(h)}:${m[2]}` : null;
  }
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  // ─── room / professor / code detection ───────────────────────
  function findRoom(text, ctx) {
    const t = String(text);
    for (const id of ctx.rooms) {
      const m = new RegExp('(?:(?:room|rm\\.?|class(?:room)?|hall)\\s*[:#]?\\s*)?(?<![A-Za-z0-9])' + escRe(id) + '(?![A-Za-z0-9])', 'i').exec(t);
      if (m) return { id, text: m[0], known: true };
    }
    const m = /(?:room|rm\.?|classroom|hall|lab)\s*[:#]?\s*([A-Za-z]{0,3}-?\d{2,3}[A-Za-z]?)/i.exec(t);
    return m ? { id: m[1].toUpperCase(), text: m[0], known: false } : null;
  }
  function findProf(text, ctx) {
    const low = text.toLowerCase();
    for (const n of ctx.professors) {
      const i = low.indexOf(n.toLowerCase());
      if (i >= 0) return { name: n, text: text.substr(i, n.length) };
    }
    const m = /((?:Prof\.?\s*Dr\.?|Prof\.?|Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s*[A-ZÀ-Ý][\w'’\-]+(?:\s+[A-ZÀ-Ý][\w'’\-]+){0,2})/.exec(text);
    return m ? { name: m[1].trim(), text: m[1] } : null;
  }

  // Pull everything we can out of one chunk of text (a cell or a line).
  function buildEntry(text, ctx, pre) {
    let rest = String(text).replace(/\s+/g, ' ').trim();
    const out = Object.assign({}, pre || {});
    if (!out.start) {
      const tr = parseTimeRange(rest, true);
      if (tr) { out.start = tr.start; out.end = tr.end; rest = rest.replace(tr.text, ' '); }
    }
    if (!out.day) { const d = findDayIn(rest); if (d) { out.day = d.day; rest = rest.replace(d.text, ' '); } }
    const rm = findRoom(rest, ctx);
    if (rm) { out.roomId = rm.id; rest = rest.replace(rm.text, ' '); }
    const pf = findProf(rest, ctx);
    if (pf) { out.professor = pf.name; rest = rest.replace(pf.text, ' '); }
    const cd = /\b([A-Z]{2,4}\s?-?\d{3,4}[A-Z]?)\b/.exec(rest);
    if (cd) { out.code = cd[1].replace(/\s/g, ''); rest = rest.replace(cd[0], ' '); }
    rest = rest.replace(/[|,;\/()\[\]]+/g, ' ').replace(/\s[-–—]\s/g, ' ').replace(/\s+/g, ' ')
               .trim().replace(/^[-–—:\s]+|[-–—:\s]+$/g, '');
    out.course = rest;
    return out;
  }

  // ─── mode A: a normal list with column headers ───────────────
  const HDR_ORDER = ['code', 'day', 'start', 'end', 'time', 'room', 'prof', 'program', 'semester', 'course'];
  const HDR = {
    code: /code/i, day: /^(day|weekday)$/i, start: /^(start|from|begin|starts?)(\s*time)?$/i,
    end: /^(end|to|until|finish|ends?)(\s*time)?$/i, time: /^(time|timing|slot|hours?|period)$/i,
    room: /(room|classroom|venue|hall|location|class\s*n)/i, prof: /(prof|lecturer|instructor|teacher|faculty|tutor|staff)/i,
    program: /(program|group|cohort|degree|major)/i, semester: /(semester|term)/i,
    course: /(course|subject|module|class|title|unit|name)/i,
  };
  function modeList(rows, ctx) {
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const map = {};
      rows[i].forEach((c, j) => {
        const t = String(c).trim(); if (!t) return;
        for (const k of HDR_ORDER) if (map[k] === undefined && HDR[k].test(t)) { map[k] = j; break; }
      });
      const hasTime = map.time !== undefined || map.start !== undefined;
      if (map.day === undefined || !hasTime || (map.course === undefined && map.room === undefined)) continue;
      const entries = []; let curDay = 0;
      for (let r = i + 1; r < rows.length; r++) {
        const row = rows[r], cell = k => (map[k] === undefined ? '' : String(row[map[k]] == null ? '' : row[map[k]]).trim());
        if (!row.some(c => String(c).trim())) continue;
        const d = dayOf(cell('day')); if (d) curDay = d;
        let start, end;
        if (map.start !== undefined && map.end !== undefined) { start = parseSingleTime(cell('start')); end = parseSingleTime(cell('end')); }
        if (!start) { const tr = parseTimeRange(cell('time') || cell('start'), false); if (tr) { start = tr.start; end = tr.end; } }
        const e = buildEntry([cell('course'), cell('room') && 'Room ' + cell('room')].join(' '), ctx, { day: curDay, start, end });
        // dedicated columns win over guessing
        if (cell('course')) e.course = cell('course');
        if (cell('room')) { const rm = findRoom(cell('room'), ctx); e.roomId = rm ? rm.id : cell('room').toUpperCase(); }
        if (cell('code')) e.code = cell('code').replace(/\s/g, '');
        if (cell('prof')) e.professor = cell('prof');
        if (cell('program')) e.program = cell('program');
        if (cell('semester')) e.semester = cell('semester');
        if (e.course || e.start) entries.push(e);
      }
      if (entries.length) return entries;
    }
    return null;
  }

  // ─── mode B: a weekly grid (times down the side, days across) ─
  function modeGrid(rows, ctx) {
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const dayCols = [];
      rows[i].forEach((c, j) => { const d = dayOf(String(c).split(/[\n(]/)[0]); if (d) dayCols.push([j, d]); });
      if (dayCols.length < 3) continue;
      const firstDay = dayCols[0][0], slots = [];
      let last = null;
      for (let r = i + 1; r < rows.length; r++) {
        let slot = null;
        for (let j = 0; j < firstDay && !slot; j++) {
          const txt = String(rows[r][j] == null ? '' : rows[r][j]);
          const tr = parseTimeRange(txt, false); if (tr) slot = { start: tr.start, end: tr.end };
          else { const st = parseSingleTime(txt); if (st) slot = { start: st, end: null }; }
        }
        if (slot) last = slot;
        slots.push(slot || last);
      }
      const entries = [];
      for (let r = i + 1; r < rows.length; r++) {
        const slot = slots[r - i - 1]; if (!slot) continue;
        let end = slot.end;
        if (!end) { // only start times in the first column: ends when the next slot starts
          for (let q = r + 1; q < rows.length; q++) { const s2 = slots[q - i - 1]; if (s2 && s2.start !== slot.start) { end = s2.start; break; } }
          if (!end) { const m = toMin(slot.start) + 60; end = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
        }
        for (const [j, d] of dayCols) {
          const txt = String(rows[r][j] == null ? '' : rows[r][j]).trim();
          if (!txt || /^(break|lunch|free|[-–—]+)$/i.test(txt)) continue;
          const e = buildEntry(txt, ctx, { day: d });
          if (!e.start) { e.start = slot.start; e.end = end; }
          entries.push(e);
        }
      }
      if (entries.length) return entries;
    }
    return null;
  }

  // ─── mode C: plain lines of text ("Mon 09:00-11:00 CS101 Intro … Room 214 Dr. X") ─
  function modeLines(rows, ctx) {
    const entries = []; let curDay = 0;
    for (const row of rows) {
      const line = row.map(c => String(c).trim()).filter(Boolean).join(' | ');
      if (!line) continue;
      const dd = findDayIn(line);
      if (dd && line.replace(dd.text, '').replace(/[^A-Za-z]/g, '').length <= 3) { curDay = dd.day; continue; }
      const tr = parseTimeRange(line, true); if (!tr) continue;
      entries.push(buildEntry(line, ctx, { day: dd ? 0 : curDay }));
    }
    return entries.length ? entries : null;
  }

  // ─── public: blocks (sheets / tables / pages) → entries ──────
  function parseBlocks(blocks, ctx) {
    const all = [];
    for (const rows of blocks) {
      const found = modeList(rows, ctx) || modeGrid(rows, ctx) || modeLines(rows, ctx);
      if (found) all.push(...found);
    }
    return all;
  }

  function initials(s) { return String(s).split(/\s+/).filter(w => /^[A-Za-z]/.test(w) && w.length > 2).map(w => w[0].toUpperCase()).join('').slice(0, 4); }
  function finalize(entries, ctx, semester) {
    return entries.map((e, n) => ({
      include: true, day: e.day || 0, start: e.start || '', end: e.end || '', roomId: e.roomId || '',
      course: e.course || '', code: e.code || initials(e.course || '') || 'CLS' + (n + 1),
      professor: e.professor || 'TBA', program: e.program || 'All Programs', semester: e.semester || semester || '',
    }));
  }

  // Checks every row; fills e.errs (blocking) and e.warns.
  function validate(entries, existing, ctx, mode) {
    const base = mode === 'replace' ? [] : existing;
    entries.forEach((e, i) => {
      e.errs = []; e.warns = [];
      if (!e.course) e.errs.push('Missing course name');
      if (!(e.day >= 1 && e.day <= 5)) e.errs.push('Day must be Mon–Fri');
      if (!e.start || !e.end) e.errs.push('Missing time');
      else if (toMin(e.start) >= toMin(e.end)) e.errs.push('End must be after start');
      const room = ctx.roomInfo[e.roomId];
      if (!e.roomId) e.errs.push('Room missing');
      else if (!room) e.errs.push(`Room "${e.roomId}" is not on the room list`);
      else if (!room.teachable) e.errs.push(`${e.roomId} is not a teaching room`);
      if (e.errs.length || !e.include) return;
      const clash = x => x.roomId === e.roomId && x.day === e.day && toMin(x.start) < toMin(e.end) && toMin(e.start) < toMin(x.end);
      const c1 = base.find(clash);
      if (c1) e.errs.push(`Clashes with existing ${c1.code} in ${e.roomId}`);
      const c2 = entries.find((x, j) => j < i && x.include && !x.errs.length && clash(x));
      if (c2) e.errs.push(`Clashes with ${c2.code} earlier in this file`);
      if (room && room.capacity === 0) e.warns.push('Room has no chair count');
    });
    return entries;
  }

  // ─── file readers (browser only) ─────────────────────────────
  async function readXlsx(buf) {
    const wb = XLSX.read(buf, { type: 'array' });
    return wb.SheetNames.map(n => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' }));
  }
  async function readDocx(buf) {
    const res = await mammoth.convertToHtml({ arrayBuffer: buf });
    const doc = new DOMParser().parseFromString(res.value, 'text/html');
    const blocks = [], loose = [];
    for (const el of doc.body.children) {
      if (el.tagName === 'TABLE') {
        el.querySelectorAll('br').forEach(b => b.replaceWith(' '));
        el.querySelectorAll('p').forEach(x => x.append(' '));
        blocks.push([...el.querySelectorAll('tr')].map(tr => [...tr.children].map(td => td.textContent.replace(/\s+/g, ' ').trim())));
      }
      else if (el.textContent.trim()) loose.push([el.textContent.trim()]);
    }
    if (loose.length) blocks.push(loose);
    return blocks;
  }
  async function readPdf(buf) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise, blocks = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const tc = await (await pdf.getPage(p)).getTextContent();
      const items = tc.items.filter(i => i.str.trim()).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: i.height || 10 }));
      const lines = [];
      items.sort((a, b) => b.y - a.y || a.x - b.x).forEach(it => {
        const L = lines.find(l => Math.abs(l.y - it.y) <= 3);
        if (L) L.items.push(it); else lines.push({ y: it.y, items: [it] });
      });
      lines.sort((a, b) => b.y - a.y);
      const rowsCells = lines.map(L => {
        L.items.sort((a, b) => a.x - b.x);
        const cells = []; let cur = null;
        for (const it of L.items) {
          if (cur && it.x - cur.x2 <= Math.max(8, it.h * 0.9)) { cur.s += (/\s$/.test(cur.s) || /^\s/.test(it.s) ? '' : ' ') + it.s; cur.x2 = it.x + it.w; }
          else { cur = { s: it.s, x: it.x, x2: it.x + it.w }; cells.push(cur); }
        }
        return cells;
      });
      // line up cells into shared columns so a grid keeps its shape
      const xs = rowsCells.flat().map(c => c.x).sort((a, b) => a - b), anchors = [];
      xs.forEach(x => { const a = anchors[anchors.length - 1]; if (a && x - a.max <= 25) { a.sum += x; a.n++; a.max = x; } else anchors.push({ sum: x, n: 1, max: x }); });
      const centers = anchors.map(a => a.sum / a.n);
      blocks.push(rowsCells.map(cells => {
        const row = new Array(centers.length).fill('');
        cells.forEach(c => {
          let k = 0; centers.forEach((cx, i) => { if (Math.abs(cx - c.x) < Math.abs(centers[k] - c.x)) k = i; });
          row[k] = row[k] ? row[k] + ' ' + c.s.trim() : c.s.trim();
        });
        return row;
      }));
    }
    return blocks;
  }
  async function readFile(file) {
    const name = file.name.toLowerCase(), buf = await file.arrayBuffer();
    if (/\.(xlsx|xlsm|xls|csv|tsv)$/.test(name)) return readXlsx(buf);
    if (/\.docx$/.test(name)) return readDocx(buf);
    if (/\.pdf$/.test(name)) return readPdf(buf);
    if (/\.doc$/.test(name)) throw new Error('Old .doc files cannot be read in the browser. Open it in Word and use Save As → .docx, then upload again.');
    throw new Error('Unsupported file type. Use PDF, Word (.docx), Excel (.xlsx) or CSV.');
  }

  const API = { parseTimeRange, parseSingleTime, parseBlocks, finalize, validate, readFile, dayOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.ScheduleImport = API;
})(typeof window !== 'undefined' ? window : globalThis);
