const C = require('../core.js'), assert = require('assert');
const arc = { name: 't', startDate: '2026-10-01', endDate: '2026-12-29', successThreshold: 80 };
assert.strictEqual(C.arcTotal(arc), 90);
assert.strictEqual(C.daysBetween('2026-10-25', '2026-11-02'), 8);           // crosses DST end in many zones
assert.strictEqual(C.addDays('2026-10-31', 1), '2026-11-01');
assert.strictEqual(C.getToday(new Date(2026, 9, 1, 23, 59)), '2026-10-01');  // local date, not UTC
assert.strictEqual(C.getToday(new Date(2026, 9, 1, 0, 1)), '2026-10-01');
assert.strictEqual(C.calculateArcDay(arc, '2026-10-24'), 24);
assert.strictEqual(C.calculateArcDay(arc, '2026-09-20'), 0);
assert.strictEqual(C.calculateDaysRemaining(arc, '2026-10-24'), 66);
assert.ok(!C.isValidDate('2026-02-30') && C.isValidDate('2026-02-28'));
const hs = [1, 2, 3, 4, 5].map(i => ({ id: 'h' + i, active: true, created: '2026-10-01', target: 1 }));
const mk = pcts => { const c = {}; pcts.forEach((p, i) => { c[C.addDays('2026-10-01', i)] = Object.fromEntries(hs.slice(0, p / 20).map(h => [h.id, 1])); }); return { winterArc: arc, habits: hs, completions: c }; };
// Spec example: 90,100,80,100,40 -> here 80,100,80,100,40
let d = mk([80, 100, 80, 100, 40]);
let s = C.calculateStreak(d, '2026-10-06');
assert.strictEqual(s.current, 0); assert.strictEqual(s.best, 4); assert.strictEqual(s.perfect, 2); assert.strictEqual(s.successful, 4);
// Unfinished today does not break streak
d = mk([80, 100, 80, 100, 0]); s = C.calculateStreak(d, '2026-10-05'); assert.strictEqual(s.current, 4);
// Yesterday missed -> reset
d = mk([100, 100, 0, 100]); s = C.calculateStreak(d, '2026-10-04'); assert.strictEqual(s.current, 1); assert.strictEqual(s.best, 2);
// Historical edit recalculates
d.completions['2026-10-03'] = Object.fromEntries(hs.map(h => [h.id, 1]));
s = C.calculateStreak(d, '2026-10-04'); assert.strictEqual(s.current, 4); assert.strictEqual(s.best, 4);
// New habit doesn't rewrite the past
d.habits.push({ id: 'new', active: true, created: '2026-10-04', target: 1 });
assert.strictEqual(C.dayStats(d, '2026-10-03').total, 5); assert.strictEqual(C.dayStats(d, '2026-10-04').total, 6);
// Target > 1 needs full count
const t = { winterArc: arc, habits: [{ id: 'w', active: true, created: '2026-10-01', target: 3 }], completions: { '2026-10-01': { w: 2 } } };
assert.strictEqual(C.dayStats(t, '2026-10-01').done, 0);
assert.strictEqual(C.scoreLabel(100), 'Perfect Day'); assert.strictEqual(C.scoreLabel(69), 'Needs Work'); assert.strictEqual(C.scoreLabel(39), 'Incomplete');
console.log('core tests passed');
