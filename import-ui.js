// import-ui.js — admin "Import Schedule" dialog (uses import-schedule.js)
let impEntries = [], impBusy = false;

function impCtx() {
  const roomInfo = {};
  ROOMS.forEach(r => roomInfo[r.id] = { teachable: r.bookable !== false && !r.restricted && !r.publicSpace, capacity: r.capacity });
  return { rooms: ROOMS.map(r => r.id).sort((a, b) => b.length - a.length), professors: PROFESSORS.map(p => p.name), roomInfo };
}
function impMode() { return (document.querySelector('input[name="imp-mode"]:checked') || {}).value || 'append'; }

function showImportModal() {
  impEntries = [];
  document.getElementById('imp-file').value = '';
  document.getElementById('imp-status').innerHTML = '';
  document.getElementById('imp-preview').style.display = 'none';
  document.getElementById('imp-overlay').classList.add('open');
}
function closeImportModal(ev, force) {
  if (force || (ev && ev.target === document.getElementById('imp-overlay'))) document.getElementById('imp-overlay').classList.remove('open');
}
function impStatus(html, kind) {
  document.getElementById('imp-status').innerHTML = html ? `<div class="imp-msg ${kind || ''}">${html}</div>` : '';
}

async function impFile(file) {
  if (!file || impBusy) return;
  impBusy = true; impStatus(`<i class="fa-solid fa-spinner fa-spin"></i> Reading ${file.name}…`);
  try {
    const ctx = impCtx();
    const blocks = await ScheduleImport.readFile(file);
    impEntries = ScheduleImport.finalize(ScheduleImport.parseBlocks(blocks, ctx), ctx, PORTAL_SETTINGS.semesterName);
    if (!impEntries.length) {
      document.getElementById('imp-preview').style.display = 'none';
      impStatus('Could not find any classes in this file. Each class needs at least a day, a time range (e.g. 09:00–11:00) and a room. If the file is a scanned image or photo, it has no text to read: use the original PDF/Word/Excel file instead.', 'err');
    } else {
      impStatus(`Found ${impEntries.length} class entries in <b>${file.name}</b>. Check them below, fix anything marked in red, then import.`, 'ok');
      document.getElementById('imp-preview').style.display = '';
      impRender();
    }
  } catch (e) {
    console.error(e); impStatus(e.message || 'Could not read this file.', 'err');
  }
  impBusy = false;
}

function impRender() {
  const dayOpts = (d) => ['—', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((n, i) => `<option value="${i}" ${i === d ? 'selected' : ''}>${n}</option>`).join('');
  const teach = ROOMS.filter(r => r.bookable !== false && !r.restricted && !r.publicSpace);
  const roomOpts = (cur) => {
    let h = `<option value="">— choose —</option>` + teach.map(r => `<option value="${r.id}" ${r.id === cur ? 'selected' : ''}>${r.id} · ${r.type} (${r.capacity})</option>`).join('');
    if (cur && !teach.some(r => r.id === cur)) h += `<option value="${cur}" selected>⚠ ${cur}</option>`;
    return h;
  };
  document.getElementById('imp-body').innerHTML = impEntries.map((e, i) => `<tr>
    <td><input type="checkbox" ${e.include ? 'checked' : ''} onchange="impSet(${i},'include',this.checked)"></td>
    <td><select class="imp-in" onchange="impSet(${i},'day',+this.value)">${dayOpts(e.day)}</select></td>
    <td style="white-space:nowrap"><input class="imp-in" type="time" value="${e.start}" onchange="impSet(${i},'start',this.value)"> <input class="imp-in" type="time" value="${e.end}" onchange="impSet(${i},'end',this.value)"></td>
    <td><select class="imp-in" onchange="impSet(${i},'roomId',this.value)">${roomOpts(e.roomId)}</select></td>
    <td><input class="imp-in" style="min-width:170px" value="${(e.course || '').replace(/"/g, '&quot;')}" onchange="impSet(${i},'course',this.value)"></td>
    <td><input class="imp-in" style="width:80px" value="${(e.code || '').replace(/"/g, '&quot;')}" onchange="impSet(${i},'code',this.value)"></td>
    <td><input class="imp-in" style="min-width:140px" value="${(e.professor || '').replace(/"/g, '&quot;')}" onchange="impSet(${i},'professor',this.value)"></td>
    <td id="imp-st-${i}" style="font-size:11.5px"></td></tr>`).join('');
  impRefresh();
}
function impSet(i, k, v) { impEntries[i][k] = v; impRefresh(); }

function impRefresh() {
  ScheduleImport.validate(impEntries, SCHEDULE, impCtx(), impMode());
  let ok = 0, bad = 0, skip = 0;
  impEntries.forEach((e, i) => {
    const td = document.getElementById('imp-st-' + i); if (!td) return;
    if (!e.include) { skip++; td.innerHTML = '<span style="color:var(--txt-muted)">Skipped</span>'; return; }
    if (e.errs.length) { bad++; td.innerHTML = `<span style="color:var(--red);font-weight:600"><i class="fa-solid fa-circle-exclamation"></i> ${e.errs.join('<br>')}</span>`; }
    else { ok++; td.innerHTML = '<span style="color:var(--green);font-weight:600"><i class="fa-solid fa-circle-check"></i> Ready</span>'; }
  });
  document.getElementById('imp-sum').innerHTML = `<b style="color:var(--green)">${ok}</b> ready · <b style="color:var(--red)">${bad}</b> need fixing · ${skip} skipped`;
  const btn = document.getElementById('imp-go'); btn.disabled = ok === 0; btn.style.opacity = ok === 0 ? .5 : 1;
  btn.innerHTML = `<i class="fa-solid fa-file-import"></i> Import ${ok} ${ok === 1 ? 'class' : 'classes'}`;
}

function impCommit() {
  const mode = impMode();
  ScheduleImport.validate(impEntries, SCHEDULE, impCtx(), mode);
  const good = impEntries.filter(e => e.include && !e.errs.length);
  if (!good.length) return;
  const bad = impEntries.filter(e => e.include && e.errs.length).length;
  if (mode === 'replace' && !confirm(`This deletes all ${SCHEDULE.length} current classes and replaces them with ${good.length} imported ones. Continue?`)) return;
  if (bad && !confirm(`${bad} row(s) still have problems and will be left out. Import the other ${good.length}?`)) return;
  if (mode === 'replace') SCHEDULE.length = 0;
  good.forEach(e => {
    SCHEDULE.push({ id: nextId(), day: e.day, start: e.start, end: e.end, roomId: e.roomId, course: e.course.trim(), code: e.code.trim(),
      professor: e.professor.trim() || 'TBA', program: e.program, semester: e.semester || PORTAL_SETTINGS.semesterName });
    const p = e.professor.trim();
    if (p && p !== 'TBA' && !PROFESSORS.some(x => x.name === p)) PROFESSORS.push({ id: nextId(), name: p, dept: 'Imported', email: '', phone: '' });
  });
  closeImportModal(null, true);
  if (typeof populateDropdowns === 'function') populateDropdowns();
  if (typeof renderAdmSched === 'function') renderAdmSched();
  if (typeof renderAdmProfs === 'function') renderAdmProfs();
  if (typeof updateQuickStats === 'function') updateQuickStats();
  showToast(`${good.length} classes imported ✓`);
}

function impTemplate() {
  const csv = 'Day,Time,Course,Code,Room,Professor,Program\nMonday,09:00-11:00,Business Fundamentals,BUS101,214,Prof. Sarah Mitchell,BA Business Administration\n';
  const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'schedule-template.csv'; a.click();
}
document.addEventListener('dragover', e => { if (document.getElementById('imp-overlay').classList.contains('open')) e.preventDefault(); });
document.addEventListener('drop', e => {
  if (!document.getElementById('imp-overlay').classList.contains('open')) return;
  e.preventDefault(); if (e.dataTransfer.files[0]) impFile(e.dataTransfer.files[0]);
});
