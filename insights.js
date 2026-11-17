// ═══════════════════════════════════════════════════
// INSIGHTS — room utilisation analytics computed live
// from the timetable (ROOMS / SCHEDULE in data.js).
// Used by the portal "Insights" tab and the pitch page.
// ═══════════════════════════════════════════════════
const Insights = (() => {
  const WEEKDAYS = [1, 2, 3, 4, 5];

  function teachingWindow() {
    let s = 8 * 60, e = 18 * 60;
    SCHEDULE.forEach(x => {
      if (x.day < 1 || x.day > 5) return;
      s = Math.min(s, Math.floor(t2m(x.start) / 60) * 60);
      e = Math.max(e, Math.ceil(t2m(x.end) / 60) * 60);
    });
    return { s, e };
  }

  function compute() {
    const rooms = bookableRooms();
    const { s, e } = teachingWindow();
    const weekMins = (e - s) * WEEKDAYS.length;
    const week = SCHEDULE.filter(x => x.day >= 1 && x.day <= 5);

    const perRoom = rooms.map(r => {
      const es = week.filter(x => x.roomId === r.id);
      const used = es.reduce((a, x) => a + (t2m(x.end) - t2m(x.start)), 0);
      return { room: r, used, util: weekMins ? used / weekMins : 0, classes: es.length };
    }).sort((a, b) => b.util - a.util);

    const hours = [];
    for (let h = s; h < e; h += 60) hours.push(h);
    const heat = WEEKDAYS.map(d => hours.map(h =>
      rooms.filter(r => week.some(x => x.roomId === r.id && x.day === d && t2m(x.start) < h + 60 && t2m(x.end) > h)).length
    ));

    let peak = { v: -1, d: 1, h: s };
    heat.forEach((row, di) => row.forEach((v, hi) => { if (v > peak.v) peak = { v, d: WEEKDAYS[di], h: hours[hi] }; }));

    const totalUsed = perRoom.reduce((a, r) => a + r.used, 0);
    const capacity = rooms.length * weekMins;
    const seatHours = rooms.reduce((a, r) => a + r.capacity, 0) * weekMins / 60;

    return {
      rooms, perRoom, hours, heat, peak, window: { s, e },
      classes: week.length,
      courses: new Set(week.map(x => x.code)).size,
      professors: new Set(week.map(x => x.professor)).size,
      programs: new Set(week.map(x => x.program)).size,
      avgUtil: capacity ? totalUsed / capacity : 0,
      freeRoomHours: Math.round((capacity - totalUsed) / 60),
      bookedHours: Math.round(totalUsed / 60),
      seatHours: Math.round(seatHours),
      underused: perRoom.filter(r => r.util < 0.25),
    };
  }

  const pct = v => `${Math.round(v * 100)}%`;
  const hourLbl = m => { const h = Math.floor(m / 60); return `${h % 12 || 12}${h >= 12 ? 'p' : 'a'}`; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function injectCSS() {
    if (document.getElementById('ins-css')) return;
    const st = document.createElement('style');
    st.id = 'ins-css';
    st.textContent = `
.ins-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px}
.ins-kpi{background:var(--ins-card,#fff);border:1px solid var(--ins-line,#E5E7EB);border-radius:12px;padding:16px}
.ins-kpi .k-l{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ins-muted,#6B7280)}
.ins-kpi .k-v{font-size:28px;font-weight:800;margin-top:6px;font-variant-numeric:tabular-nums;color:var(--ins-ink,#111827)}
.ins-kpi .k-s{font-size:12px;color:var(--ins-muted,#6B7280);margin-top:2px}
.ins-grid{display:grid;grid-template-columns:1fr 1.25fr;gap:16px}
@media(max-width:860px){.ins-grid{grid-template-columns:1fr}}
.ins-panel{background:var(--ins-card,#fff);border:1px solid var(--ins-line,#E5E7EB);border-radius:12px;padding:18px}
.ins-panel h4{font-size:13.5px;font-weight:700;margin-bottom:4px;color:var(--ins-ink,#111827)}
.ins-panel .ins-sub{font-size:12px;color:var(--ins-muted,#6B7280);margin-bottom:14px}
.ins-bar{display:grid;grid-template-columns:110px 1fr 44px;align-items:center;gap:10px;font-size:12.5px;margin-bottom:8px;color:var(--ins-ink,#111827)}
.ins-bar .b-n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ins-bar .b-t{height:10px;background:var(--ins-track,#F1F2F4);border-radius:6px;overflow:hidden}
.ins-bar .b-f{height:100%;border-radius:6px;background:var(--ins-accent,#C8102E);transform-origin:left;animation:insGrow .9s cubic-bezier(.2,.8,.2,1) both}
.ins-bar .b-f.low{background:var(--ins-low,#9CA3AF)}
.ins-bar .b-p{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}
@keyframes insGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ins-heat{width:100%;border-collapse:separate;border-spacing:3px;font-size:11px}
.ins-heat th{font-weight:600;color:var(--ins-muted,#6B7280);padding:2px;text-align:center}
.ins-heat th.d{text-align:left;padding-right:6px}
.ins-heat td{height:28px;border-radius:5px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.ins-legend{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ins-muted,#6B7280);margin-top:10px}
.ins-legend span.sw{width:18px;height:10px;border-radius:3px;display:inline-block}
.ins-note{margin-top:16px;padding:12px 14px;border-radius:10px;background:var(--ins-note,#FEF0F0);color:var(--ins-ink,#111827);font-size:12.5px;line-height:1.5}
`;
    document.head.appendChild(st);
  }

  function heatColor(v, max) {
    if (!v) return { bg: 'var(--ins-track,#F1F2F4)', fg: 'var(--ins-muted,#9CA3AF)' };
    const t = v / Math.max(1, max);
    const a = (0.15 + 0.85 * t).toFixed(2);
    return { bg: `rgba(200,16,46,${a})`, fg: t > 0.45 ? '#fff' : 'var(--ins-ink,#111827)' };
  }

  function render(el, opts = {}) {
    injectCSS();
    const d = compute();
    const max = Math.max(1, ...d.heat.flat());
    const kpis = [
      ['Avg. room utilisation', pct(d.avgUtil), `Mon–Fri, ${fmtT(m2t(d.window.s))}–${fmtT(m2t(d.window.e))}`],
      ['Booked room-hours', d.bookedHours, 'per teaching week'],
      ['Idle room-hours', d.freeRoomHours, 'available to re-allocate'],
      ['Peak demand', `${d.peak.v}/${d.rooms.length}`, `rooms busy · ${DAY_SHORT[d.peak.d]} ${fmtT(m2t(d.peak.h))}`],
      ['Classes tracked', d.classes, `${d.courses} courses · ${d.professors} faculty`],
    ];
    const bars = d.perRoom.map(r => `
      <div class="ins-bar" title="${esc(r.room.name)} · ${r.classes} classes · ${fmtDur(r.used)} booked">
        <div class="b-n">${esc(r.room.name)}</div>
        <div class="b-t"><div class="b-f ${r.util < 0.25 ? 'low' : ''}" style="width:${Math.max(2, r.util * 100).toFixed(1)}%"></div></div>
        <div class="b-p">${pct(r.util)}</div>
      </div>`).join('');
    const heat = `<table class="ins-heat" role="table" aria-label="Rooms in use by day and hour">
      <thead><tr><th></th>${d.hours.map(h => `<th>${hourLbl(h)}</th>`).join('')}</tr></thead>
      <tbody>${d.heat.map((row, i) => `<tr><th class="d">${DAY_SHORT[i + 1]}</th>${row.map((v, hi) => {
        const c = heatColor(v, max);
        return `<td style="background:${c.bg};color:${c.fg}" title="${DAY_NAMES[i + 1]} ${fmtT(m2t(d.hours[hi]))}: ${v} of ${d.rooms.length} rooms in use">${v || ''}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table>
      <div class="ins-legend">Fewer <span class="sw" style="background:rgba(200,16,46,.15)"></span><span class="sw" style="background:rgba(200,16,46,.5)"></span><span class="sw" style="background:rgba(200,16,46,1)"></span> More rooms in use</div>`;
    const under = d.underused.map(r => r.room.name);
    const note = under.length
      ? `<b>Opportunity:</b> ${under.length} room${under.length > 1 ? 's are' : ' is'} booked less than 25% of the week (${esc(under.slice(0, 4).join(', '))}${under.length > 4 ? '…' : ''}). That's capacity for extra sections, exams or events, without new space.`
      : `<b>Healthy:</b> every bookable room is used at least 25% of the teaching week.`;

    el.innerHTML = `
      <div class="ins-kpis">${kpis.map(k => `<div class="ins-kpi"><div class="k-l">${k[0]}</div><div class="k-v">${k[1]}</div><div class="k-s">${k[2]}</div></div>`).join('')}</div>
      <div class="ins-grid">
        <div class="ins-panel"><h4>Utilisation by room</h4><div class="ins-sub">Share of teaching hours each room is booked</div>${bars}</div>
        <div class="ins-panel"><h4>When is campus busiest?</h4><div class="ins-sub">Number of rooms in use, by day and hour</div>${heat}</div>
      </div>
      ${opts.note === false ? '' : `<div class="ins-note">${note}</div>`}`;
    return d;
  }

  return { compute, render };
})();
