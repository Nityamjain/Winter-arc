/* Pure date/score/streak logic. All dates are local "YYYY-MM-DD" strings; no UTC conversion anywhere. */
(function (root) {
  'use strict';
  // Configurable score bands (min % inclusive), checked top-down.
  var LEVELS = [
    { min: 100, label: 'Perfect Day' },
    { min: 70, label: 'Almost There' },
    { min: 40, label: 'Needs Work' },
    { min: 0, label: 'Incomplete' }
  ];
  var pad = function (n) { return String(n).padStart(2, '0'); };
  function formatDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDate(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function getToday(now) { return formatDate(now || new Date()); }
  function isValidDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && formatDate(parseDate(s)) === s; }
  function daysBetween(a, b) {
    var x = a.split('-').map(Number), y = b.split('-').map(Number);
    return Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(x[0], x[1] - 1, x[2])) / 864e5);
  }
  function addDays(s, n) { var d = parseDate(s); d.setDate(d.getDate() + n); return formatDate(d); }
  function arcTotal(arc) { return daysBetween(arc.startDate, arc.endDate) + 1; }
  function calculateArcDay(arc, today) { return Math.max(0, Math.min(daysBetween(arc.startDate, today) + 1, arcTotal(arc))); }
  function calculateDaysRemaining(arc, today) { return Math.max(0, arcTotal(arc) - calculateArcDay(arc, today)); }
  function scoreLabel(pct) { for (var i = 0; i < LEVELS.length; i++) if (pct >= LEVELS[i].min) return LEVELS[i].label; return LEVELS[LEVELS.length - 1].label; }

  function habitsFor(data, date) { return data.habits.filter(function (h) { return h.active && h.created <= date; }); }
  function isDone(h, comp) { return ((comp && comp[h.id]) || 0) >= h.target; }
  function dayStats(data, date) {
    var hs = habitsFor(data, date), comp = data.completions[date] || {};
    var done = hs.filter(function (h) { return isDone(h, comp); }).length;
    return { done: done, total: hs.length, pct: hs.length ? Math.round(done / hs.length * 100) : 0 };
  }
  // 'future' | 'none' (no habits) | 'perfect' | 'success' | 'partial' | 'missed'
  function dayStatus(data, date, today) {
    if (date > today) return 'future';
    var s = dayStats(data, date);
    if (!s.total) return 'none';
    if (s.pct === 100) return 'perfect';
    if (s.pct >= data.winterArc.successThreshold) return 'success';
    return s.pct > 0 ? 'partial' : 'missed';
  }
  function arcDays(arc, today) {
    var last = today < arc.endDate ? today : arc.endDate, out = [];
    if (today < arc.startDate) return out;
    for (var d = arc.startDate; d <= last; d = addDays(d, 1)) out.push(d);
    return out;
  }
  // Derived from source completions every time; nothing streak-related is stored.
  function calculateStreak(data, today) {
    var days = arcDays(data.winterArc, today), run = 0, best = 0, succ = 0, perf = 0, done = 0, possible = 0;
    var ok = days.map(function (d) {
      var st = dayStatus(data, d, today), s = dayStats(data, d);
      done += s.done; possible += s.total;
      if (st === 'perfect') perf++;
      var good = st === 'perfect' || st === 'success';
      if (good) succ++;
      return good;
    });
    ok.forEach(function (g) { run = g ? run + 1 : 0; if (run > best) best = run; });
    // Current streak: count back from today; an unfinished today doesn't break it yet.
    var i = ok.length - 1;
    if (i >= 0 && days[i] === today && !ok[i]) i--;
    var cur = 0;
    while (i >= 0 && ok[i]) { cur++; i--; }
    return { current: cur, best: best, successful: succ, perfect: perf, habitsCompleted: done, possible: possible,
      overall: possible ? Math.round(done / possible * 100) : 0 };
  }
  function habitRate(data, h, today) {
    var days = arcDays(data.winterArc, today).filter(function (d) { return d >= h.created; }), n = 0;
    days.forEach(function (d) { if (isDone(h, data.completions[d])) n++; });
    return { done: n, days: days.length, pct: days.length ? Math.round(n / days.length * 100) : 0 };
  }
  var api = { LEVELS: LEVELS, formatDate: formatDate, parseDate: parseDate, getToday: getToday, isValidDate: isValidDate,
    daysBetween: daysBetween, addDays: addDays, arcTotal: arcTotal, calculateArcDay: calculateArcDay,
    calculateDaysRemaining: calculateDaysRemaining, scoreLabel: scoreLabel, habitsFor: habitsFor, isDone: isDone,
    dayStats: dayStats, dayStatus: dayStatus, arcDays: arcDays, calculateStreak: calculateStreak, habitRate: habitRate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WinterCore = api;
})(this);
