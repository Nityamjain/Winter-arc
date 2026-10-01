(function () {
'use strict';
var C = WinterCore, KEY = 'winterArc.v1', FIRED = 'winterArc.fired';
var CATS = ['Fitness', 'Health', 'Productivity', 'Learning', 'Mind', 'Personal'];
var $ = function (s) { return document.querySelector(s); };
var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var view = 'home', calMonth = null, swReg = null, D = load();

function blank() {
  return { version: 1, winterArc: null, habits: [], categories: CATS.slice(), completions: {}, settings: { theme: 'dark' },
    notificationSettings: { morning: { on: false, time: '06:30' }, evening: { on: false, time: '22:00' } }, streakShield: {} };
}
function load() { try { var r = localStorage.getItem(KEY); if (r) return Object.assign(blank(), JSON.parse(r)); } catch (e) {} return blank(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast('Could not save. Storage is full or blocked.'); } }
function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2600); }
var today = function () { return C.getToday(); };
var fmtLong = function (s) { return C.parseDate(s).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }); };
var fmtShort = function (s) { return C.parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
function inArc(d) { return d >= D.winterArc.startDate && d <= D.winterArc.endDate; }
function editable(d) { return inArc(d) && d <= today(); }

/* ---------- theme ---------- */
function applyTheme() {
  var t = D.settings.theme, dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0f1a2b' : '#eef4f9';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

/* ---------- sheets ---------- */
function openSheet(html) { $('#sheet').innerHTML = html; $('#sheetWrap').hidden = false; var f = $('#sheet input,#sheet button'); if (f) f.focus(); }
function closeSheet() { $('#sheetWrap').hidden = true; $('#sheet').innerHTML = ''; }
function confirmBox(title, body, okLabel) {
  return new Promise(function (res) {
    openSheet('<h3>' + esc(title) + '</h3><p class="mut">' + esc(body) + '</p><div class="btns"><button class="btn" data-act="no">Cancel</button><button class="btn bad" data-act="yes">' + esc(okLabel) + '</button></div>');
    $('#sheet').onclick = function (e) { var a = e.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'yes' || a.dataset.act === 'no') { e.stopPropagation(); $('#sheet').onclick = null; closeSheet(); res(a.dataset.act === 'yes'); } };
  });
}

/* ---------- render ---------- */
function render() {
  applyTheme();
  var has = !!D.winterArc;
  $('#nav').hidden = !has; $('#fab').hidden = !(has && view === 'home');
  document.querySelectorAll('#nav button').forEach(function (b) { b.toggleAttribute('aria-current', b.dataset.v === view); if (b.dataset.v === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $('#main').innerHTML = !has ? setupHtml() : view === 'home' ? homeHtml() : view === 'history' ? historyHtml() : view === 'stats' ? statsHtml() : settingsHtml();
}
function ring(pct) { var c = 2 * Math.PI * 52; return '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" cx="60" cy="60" r="52" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct / 100)).toFixed(1) + '"/></svg>'; }

function habitCard(h, date, ok) {
  var n = (D.completions[date] || {})[h.id] || 0, done = n >= h.target;
  return '<button class="card' + (done ? ' done' : '') + '" data-act="toggle" data-d="' + date + '" data-id="' + h.id + '" aria-pressed="' + done + '"' + (ok ? '' : ' disabled') + '>' +
    '<span class="tick" aria-hidden="true">' + (done ? '✓' : h.target > 1 ? n : '') + '</span><span><span class="nm">' + esc(h.name) + '</span><span class="mut">' + esc(h.category) + (h.target > 1 ? ' · ' + n + '/' + h.target : '') + '</span></span><span class="mut" style="margin-left:auto">' + (done ? 'Done' : 'To do') + '</span></button>';
}
function homeHtml() {
  var a = D.winterArc, t = today(), total = C.arcTotal(a), day = C.calculateArcDay(a, t), left = C.calculateDaysRemaining(a, t);
  var date = t < a.startDate ? a.startDate : t > a.endDate ? a.endDate : t, s = C.dayStats(D, date), st = C.calculateStreak(D, t);
  var q = QUOTES[(C.daysBetween(a.startDate, t) % QUOTES.length + QUOTES.length) % QUOTES.length];
  var note = t < a.startDate ? 'Starts in ' + C.daysBetween(t, a.startDate) + ' days' : t > a.endDate ? 'Arc complete' : left + ' days left';
  var hs = C.habitsFor(D, date);
  return '<div class="top"><div><p class="mut" style="margin:0 0 6px;font-weight:700">' + esc(a.name) + '</p><h1>Day ' + day + ' / ' + total + '</h1><p class="mut" style="margin:6px 0 0">' + note + '</p></div><div class="chip" aria-label="Current streak ' + st.current + ' days">🔥 ' + st.current + '</div></div>' +
    '<div class="ringWrap" role="img" aria-label="Today ' + s.pct + ' percent">' + ring(s.pct) + '<div class="ringTxt"><b>' + s.pct + '%</b><span class="mut">Today</span></div></div>' +
    '<p class="center" style="margin:0"><b>' + s.done + ' / ' + s.total + ' habits completed</b><br><span class="mut">' + C.scoreLabel(s.pct) + ' · best streak ' + st.best + '</span></p>' +
    '<p class="quote">' + esc(q) + '</p><h2>Today\'s habits</h2>' +
    (hs.length ? hs.map(function (h) { return habitCard(h, date, editable(date)); }).join('') : '<p class="mut">No active habits yet. Tap + to add one.</p>');
}

function historyHtml() {
  var a = D.winterArc, t = today();
  if (!calMonth) calMonth = (t < a.startDate ? a.startDate : t > a.endDate ? a.endDate : t).slice(0, 7);
  var y = +calMonth.slice(0, 4), m = +calMonth.slice(5) - 1, first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate();
  var glyph = { perfect: '★', success: '✓', partial: '◐', missed: '✕', future: '·', none: '–' };
  var cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d) { return '<div class="dow">' + d + '</div>'; }).join('');
  for (var i = 0; i < lead; i++) cells += '<button class="off" tabindex="-1" aria-hidden="true"></button>';
  for (var d = 1; d <= n; d++) {
    var ds = C.formatDate(new Date(y, m, d)), out = !inArc(ds), stt = out ? 'future' : C.dayStatus(D, ds, t);
    cells += '<button class="' + (out ? 'out ' : '') + stt + (ds === t ? ' today' : '') + '" data-act="day" data-d="' + ds + '"' + (out ? ' disabled' : '') + ' aria-label="' + fmtLong(ds) + ', ' + stt + '"><b>' + d + '</b><span>' + glyph[stt] + '</span></button>';
  }
  return '<div class="top"><h1>History</h1></div><div class="row" style="border:0;margin-top:14px"><button class="btn" data-act="month" data-n="-1" aria-label="Previous month">‹</button><b>' + first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + '</b><button class="btn" data-act="month" data-n="1" aria-label="Next month">›</button></div>' +
    '<div class="cal">' + cells + '</div><div class="legend"><span>★ Perfect</span><span>✓ Successful</span><span>◐ Partial</span><span>✕ Missed</span><span>· Future</span></div><p class="mut">Tap a day to view or edit it.</p>';
}
function dayHtml(date) {
  var s = C.dayStats(D, date), ok = editable(date), hs = C.habitsFor(D, date);
  return '<h3>' + fmtLong(date) + '</h3><p class="mut" style="margin:0 0 14px"><b style="color:var(--tx);font-size:1.6rem">' + s.pct + '%</b> · ' + s.done + ' / ' + s.total + ' completed' + (ok ? '' : ' · locked (future)') + '</p>' +
    (hs.length ? hs.map(function (h) { return habitCard(h, date, ok); }).join('') : '<p class="mut">No habits were active on this day.</p>') + '<div class="btns"><button class="btn" data-act="closeSheet">Close</button></div>';
}

function statsHtml() {
  var a = D.winterArc, t = today(), st = C.calculateStreak(D, t), total = C.arcTotal(a), day = C.calculateArcDay(a, t), prog = Math.round(day / total * 100);
  var box = function (v, l) { return '<div class="stat"><b>' + v + '</b><span class="mut">' + l + '</span></div>'; };
  var rows = D.habits.map(function (h) { var r = C.habitRate(D, h, t); return '<div class="hp"><div><span>' + esc(h.name) + (h.active ? '' : ' (off)') + '</span><span>' + r.pct + '%</span></div><div class="bar"><i style="width:' + r.pct + '%"></i></div></div>'; }).join('');
  return '<div class="top"><h1>Stats</h1></div><h2>' + esc(a.name) + '</h2><div class="stat"><b>Day ' + day + ' / ' + total + '</b><div class="bar" role="progressbar" aria-valuenow="' + prog + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + prog + '%"></i></div>' +
    '<p class="mut" style="margin:8px 0 0">' + prog + '% complete · ' + C.calculateDaysRemaining(a, t) + ' days remaining<br>' + fmtLong(a.startDate) + ' to ' + fmtLong(a.endDate) + '<br>' + day + ' days elapsed · overall completion ' + st.overall + '%</p></div>' +
    '<h2>Totals</h2><div class="grid">' + box(st.overall + '%', 'Overall completion') + box(st.current, 'Current streak') + box(st.best, 'Best streak') + box(st.perfect, 'Perfect days') + box(st.successful, 'Successful days') + box(st.habitsCompleted, 'Habits completed') + '</div>' +
    '<h2>Habit performance</h2>' + (rows || '<p class="mut">No habits yet.</p>');
}

function settingsHtml() {
  var a = D.winterArc, th = D.settings.theme, ns = D.notificationSettings;
  var seg = ['dark', 'light', 'system'].map(function (v) { return '<button data-act="theme" data-v="' + v + '" aria-pressed="' + (th === v) + '">' + v[0].toUpperCase() + v.slice(1) + '</button>'; }).join('');
  var rem = function (k, l) { return '<div class="row"><label class="chk" style="margin:0"><input type="checkbox" data-chg="rem" data-k="' + k + '"' + (ns[k].on ? ' checked' : '') + '>' + l + '</label><input type="time" style="width:130px" data-chg="remt" data-k="' + k + '" value="' + ns[k].time + '" aria-label="' + l + ' time"></div>'; };
  return '<div class="top"><h1>Settings</h1></div><h2>Winter Arc</h2><div class="row"><span>' + esc(a.name) + '<br><span class="mut">' + fmtShort(a.startDate) + ' to ' + fmtShort(a.endDate) + ' · success at ' + a.successThreshold + '%</span></span><button class="btn" data-act="editArc">Edit</button></div>' +
    '<h2>Habits</h2>' + (D.habits.map(function (h) { return '<div class="row"><span>' + esc(h.name) + '<br><span class="mut">' + esc(h.category) + (h.active ? '' : ' · disabled') + '</span></span><button class="btn" data-act="editHabit" data-id="' + h.id + '">Edit</button></div>'; }).join('') || '<p class="mut">No habits yet.</p>') +
    '<h2>Appearance</h2><div class="seg" role="group" aria-label="Theme">' + seg + '</div>' +
    '<h2>Reminders</h2>' + rem('morning', 'Morning reminder') + rem('evening', 'Evening review') + '<p class="mut">Reminders only fire while the app is open or running in the background. See the README for limits.</p>' +
    '<h2>Data</h2><div class="btns"><button class="btn" data-act="export">Export data</button><button class="btn" data-act="import">Import data</button></div><div class="btns"><button class="btn bad" data-act="reset">Reset everything</button></div>';
}

/* ---------- arc setup / edit ---------- */
function arcForm(a, editing) {
  return '<form id="arcForm" class="' + (editing ? '' : 'setup') + '" novalidate>' + (editing ? '<h3>Edit Winter Arc</h3>' : '<h1>Winter Arc</h1><p class="mut">Set up your arc. Everything stays on this device.</p>') +
    '<label for="an">Winter Arc name</label><input type="text" id="an" maxlength="40" value="' + esc(a.name) + '">' +
    '<label for="as">Start date</label><input type="date" id="as" value="' + a.startDate + '"><label for="ae">End date</label><input type="date" id="ae" value="' + a.endDate + '">' +
    '<label for="at">Daily success threshold (%)</label><input type="number" id="at" min="1" max="100" value="' + a.successThreshold + '">' +
    '<p class="err" id="arcErr" role="alert"></p><div class="btns">' + (editing ? '<button type="button" class="btn" data-act="closeSheet">Cancel</button>' : '') + '<button class="btn pri" type="submit">' + (editing ? 'Save' : 'Start my Winter Arc') + '</button></div></form>';
}
function setupHtml() { return arcForm({ name: 'Winter Arc 2026', startDate: '2026-10-01', endDate: '2026-12-29', successThreshold: 80 }, false); }
function submitArc() {
  var a = { name: $('#an').value.trim(), startDate: $('#as').value, endDate: $('#ae').value, successThreshold: Math.round(+$('#at').value) }, e = '';
  if (!a.name) e = 'Enter a name.'; else if (!C.isValidDate(a.startDate) || !C.isValidDate(a.endDate)) e = 'Choose valid start and end dates.';
  else if (a.endDate <= a.startDate) e = 'End date must be after the start date.'; else if (C.daysBetween(a.startDate, a.endDate) > 730) e = 'An arc can be at most 2 years.';
  else if (!(a.successThreshold >= 1 && a.successThreshold <= 100)) e = 'Threshold must be between 1 and 100.';
  if (e) { $('#arcErr').textContent = e; return; }
  var first = !D.winterArc; D.winterArc = a;
  if (first && !D.habits.length) D.habits = ['Workout|Fitness', 'Study|Productivity', 'Read 20 Pages|Learning', 'Meditation|Mind'].map(function (s, i) { var p = s.split('|'); return { id: 'habit-00' + (i + 1), name: p[0], category: p[1], target: 1, active: true, reminderEnabled: false, reminderTime: '20:00', created: a.startDate }; });
  save(); closeSheet(); render();
}

/* ---------- habits ---------- */
function habitForm(h) {
  var e = !!h; h = h || { name: '', category: CATS[0], target: 1, active: true, reminderEnabled: false, reminderTime: '20:00' };
  return '<form id="habitForm" data-id="' + (e ? h.id : '') + '" novalidate><h3>' + (e ? 'Edit habit' : 'Add habit') + '</h3>' +
    '<label for="hn">Habit name</label><input type="text" id="hn" maxlength="40" value="' + esc(h.name) + '">' +
    '<label for="hc">Category</label><select id="hc">' + D.categories.map(function (c) { return '<option' + (c === h.category ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' +
    '<label for="hnc">Or create a new category</label><input type="text" id="hnc" maxlength="24" placeholder="Optional">' +
    '<label for="ht">Daily target (times)</label><input type="number" id="ht" min="1" max="20" value="' + h.target + '">' +
    '<label class="chk"><input type="checkbox" id="hr"' + (h.reminderEnabled ? ' checked' : '') + '>Remind me at</label><input type="time" id="hrt" value="' + h.reminderTime + '" aria-label="Reminder time">' +
    (e ? '<label class="chk"><input type="checkbox" id="ha"' + (h.active ? ' checked' : '') + '>Enabled</label>' : '') +
    '<p class="err" id="habErr" role="alert"></p><div class="btns"><button type="button" class="btn" data-act="closeSheet">Cancel</button>' + (e ? '<button type="button" class="btn bad" data-act="delHabit" data-id="' + h.id + '">Delete</button>' : '') + '<button class="btn pri" type="submit">Save habit</button></div></form>';
}
function submitHabit(form) {
  var id = form.dataset.id, name = $('#hn').value.trim(), cat = $('#hnc').value.trim() || $('#hc').value, tg = Math.round(+$('#ht').value);
  if (!name) { $('#habErr').textContent = 'Enter a habit name.'; return; }
  if (!(tg >= 1 && tg <= 20)) { $('#habErr').textContent = 'Target must be between 1 and 20.'; return; }
  if (D.categories.indexOf(cat) < 0) D.categories.push(cat);
  var f = { name: name, category: cat, target: tg, reminderEnabled: $('#hr').checked, reminderTime: $('#hrt').value || '20:00' };
  if (id) { var h = D.habits.filter(function (x) { return x.id === id; })[0]; Object.assign(h, f, { active: $('#ha').checked }); }
  else { var t = today(); D.habits.push(Object.assign(f, { id: 'habit-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), active: true, created: t < D.winterArc.startDate ? D.winterArc.startDate : t })); }
  if (f.reminderEnabled) ensurePerm();
  save(); closeSheet(); render();
}
function toggle(date, id) {
  if (!editable(date)) return;
  var h = D.habits.filter(function (x) { return x.id === id; })[0]; if (!h) return;
  var day = D.completions[date] = D.completions[date] || {}, n = day[id] || 0;
  day[id] = n >= h.target ? 0 : (h.target > 1 ? n + 1 : 1);
  if (!day[id]) delete day[id];
  if (!Object.keys(day).length) delete D.completions[date];
  save(); render();
  if (!$('#sheetWrap').hidden && $('#sheet').querySelector('[data-act=toggle]')) { $('#sheet').innerHTML = dayHtml(date); }
}

/* ---------- export / import / reset ---------- */
function exportData() {
  var blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'winter-arc-backup-' + today() + '.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); toast('Backup downloaded');
}
function validate(d) {
  var bad = function (m) { throw new Error(m); }, num = function (v) { return typeof v === 'number' && isFinite(v) && v >= 0; };
  if (!d || typeof d !== 'object' || Array.isArray(d)) bad('File is not a Winter Arc backup.');
  var a = d.winterArc; if (!a || typeof a.name !== 'string' || !C.isValidDate(a.startDate) || !C.isValidDate(a.endDate) || a.endDate <= a.startDate) bad('Winter Arc name or dates are invalid.');
  if (typeof a.successThreshold !== 'number' || a.successThreshold < 1 || a.successThreshold > 100) bad('Success threshold is invalid.');
  if (!Array.isArray(d.habits)) bad('Habits are missing.');
  var ids = {}; d.habits.forEach(function (h) {
    if (!h || typeof h.id !== 'string' || !h.id || ids[h.id]) bad('Habit IDs are missing or duplicated.'); ids[h.id] = 1;
    if (typeof h.name !== 'string' || typeof h.category !== 'string' || typeof h.active !== 'boolean') bad('Habit "' + h.id + '" has invalid fields.');
    if (!(Number.isInteger(h.target) && h.target >= 1)) h.target = 1;
    if (!C.isValidDate(h.created)) h.created = a.startDate;
    h.reminderEnabled = !!h.reminderEnabled; if (!/^\d\d:\d\d$/.test(h.reminderTime || '')) h.reminderTime = '20:00';
  });
  var comp = d.completions; if (!comp || typeof comp !== 'object' || Array.isArray(comp)) bad('Completions are missing.');
  Object.keys(comp).forEach(function (k) { if (!C.isValidDate(k)) bad('Invalid date in history: ' + k); var day = comp[k]; if (!day || typeof day !== 'object') bad('Invalid data for ' + k);
    Object.keys(day).forEach(function (id) { if (!ids[id]) delete day[id]; else if (day[id] === true) day[id] = 1; else if (!num(day[id])) bad('Invalid value on ' + k); }); });
  var out = Object.assign(blank(), d); out.categories = Array.isArray(d.categories) ? d.categories.filter(function (c) { return typeof c === 'string'; }) : CATS.slice();
  d.habits.forEach(function (h) { if (out.categories.indexOf(h.category) < 0) out.categories.push(h.category); });
  out.settings = Object.assign({ theme: 'dark' }, d.settings); if (['dark', 'light', 'system'].indexOf(out.settings.theme) < 0) out.settings.theme = 'dark';
  out.notificationSettings = Object.assign(blank().notificationSettings, d.notificationSettings);
  return out;
}
function importFile(file) {
  var r = new FileReader();
  r.onload = function () {
    var parsed; try { parsed = validate(JSON.parse(r.result)); } catch (e) { toast(e instanceof SyntaxError ? 'That file is not valid JSON.' : e.message); return; }
    confirmBox('Replace current data?', 'This replaces your current Winter Arc, habits and history with the backup "' + parsed.winterArc.name + '".', 'Replace').then(function (ok) { if (ok) { D = parsed; save(); render(); toast('Backup imported'); } });
  };
  r.onerror = function () { toast('Could not read the file.'); }; r.readAsText(file);
}

/* ---------- reminders ---------- */
function ensurePerm() {
  if (!('Notification' in window)) { toast('Notifications are not supported in this browser.'); return Promise.resolve(false); }
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') { toast('Notifications are blocked. Enable them in browser settings.'); return Promise.resolve(false); }
  return Notification.requestPermission().then(function (p) { if (p !== 'granted') toast('Permission not granted. Reminders will not show.'); return p === 'granted'; });
}
function notify(title, body, tag) {
  try { var o = { body: body, tag: tag, icon: 'icons/icon-192.png' }; if (swReg && swReg.showNotification) swReg.showNotification(title, o); else new Notification(title, o); } catch (e) {}
}
function tick() {
  if (!D.winterArc || !('Notification' in window) || Notification.permission !== 'granted') return;
  var t = today(); if (!inArc(t)) return;
  var now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), fired; try { fired = JSON.parse(localStorage.getItem(FIRED) || '{}'); } catch (e) { fired = {}; }
  Object.keys(fired).forEach(function (k) { if (k.slice(0, 10) !== t) delete fired[k]; });
  var due = function (key, time) { var p = time.split(':'), d = nm - (+p[0] * 60 + +p[1]); if (d >= 0 && d <= 10 && !fired[t + key]) { fired[t + key] = 1; return true; } return false; };
  var s = C.dayStats(D, t), ns = D.notificationSettings, thr = D.winterArc.successThreshold;
  if (ns.morning.on && due('|m', ns.morning.time)) notify('Winter Arc', QUOTES[C.daysBetween(D.winterArc.startDate, t) % QUOTES.length], 'm');
  if (ns.evening.on && due('|e', ns.evening.time)) notify('Winter Arc', s.pct >= 100 ? 'Perfect day completed.\nKeep the streak alive.' : s.pct < thr ? "You're at " + s.pct + '%.\nYou still have unfinished habits.' : "You're at " + s.pct + '%.\nFinish strong.', 'e');
  D.habits.forEach(function (h) { if (h.active && h.reminderEnabled && h.created <= t && !C.isDone(h, D.completions[t]) && due('|' + h.id, h.reminderTime)) notify(h.name, 'Not done yet today.', h.id); });
  try { localStorage.setItem(FIRED, JSON.stringify(fired)); } catch (e) {}
}

/* ---------- events ---------- */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (!b) return; var d = b.dataset;
  switch (d.act) {
    case 'nav': view = d.v; render(); $('#main').scrollTop = 0; break;
    case 'toggle': toggle(d.d, d.id); break;
    case 'addHabit': openSheet(habitForm()); break;
    case 'editHabit': openSheet(habitForm(D.habits.filter(function (h) { return h.id === d.id; })[0])); break;
    case 'delHabit': confirmBox('Delete this habit?', 'Its history will be removed and past scores will change.', 'Delete').then(function (ok) { if (!ok) return; D.habits = D.habits.filter(function (h) { return h.id !== d.id; });
      Object.keys(D.completions).forEach(function (k) { delete D.completions[k][d.id]; if (!Object.keys(D.completions[k]).length) delete D.completions[k]; }); save(); closeSheet(); render(); }); break;
    case 'day': openSheet(dayHtml(d.d)); break;
    case 'month': var y = +calMonth.slice(0, 4), m = +calMonth.slice(5) - 1 + +d.n; calMonth = C.formatDate(new Date(y, m, 1)).slice(0, 7); render(); break;
    case 'theme': D.settings.theme = d.v; save(); render(); break;
    case 'editArc': openSheet(arcForm(D.winterArc, true)); break;
    case 'export': exportData(); break;
    case 'import': $('#file').value = ''; $('#file').click(); break;
    case 'reset': confirmBox('Reset everything?', 'This will permanently delete your Winter Arc, habits, history and statistics from this device.', 'Delete everything').then(function (ok) { if (ok) { localStorage.removeItem(KEY); localStorage.removeItem(FIRED); D = blank(); view = 'home'; calMonth = null; render(); } }); break;
    case 'closeSheet': closeSheet(); break;
  }
});
document.addEventListener('submit', function (e) { e.preventDefault(); if (e.target.id === 'arcForm') submitArc(); else if (e.target.id === 'habitForm') submitHabit(e.target); });
document.addEventListener('change', function (e) {
  var t = e.target, k = t.dataset.k; if (t.dataset.chg === 'rem') { if (t.checked) ensurePerm(); D.notificationSettings[k].on = t.checked; save(); }
  else if (t.dataset.chg === 'remt') { D.notificationSettings[k].time = t.value || D.notificationSettings[k].time; save(); }
  else if (t.id === 'file' && t.files[0]) importFile(t.files[0]);
});
document.addEventListener('input', function (e) { if (e.target.id === 'as' && C.isValidDate(e.target.value) && $('#ae') && !$('#ae').dataset.touched) $('#ae').value = C.addDays(e.target.value, 89); else if (e.target.id === 'ae') e.target.dataset.touched = 1; });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#sheetWrap').hidden) closeSheet(); });
document.addEventListener('visibilitychange', function () { if (!document.hidden) { render(); tick(); } });

render(); setInterval(tick, 30000); tick();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').then(function (r) { swReg = r; }).catch(function () {});
})();
