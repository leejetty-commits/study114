import fs from 'fs';
const a = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const b = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const D = 'concern-director';
const T = 'concern-tutor';
const P = 'concern-parent';
const scen = process.argv[4] || 'default';
const FIND = {
  default: { 공부방: [D, T, P], 과외쌤: [T, D, P], 학생: [P], 비회원: [P, D, T] },
  old: { 공부방: [P], 과외쌤: [P], 학생: [P], 비회원: [P] },
  removed: { 공부방: [D, P], 과외쌤: [D, P], 학생: [P], 비회원: [P, D] },
  libold: { 공부방: [], 과외쌤: [], 학생: [], 비회원: [] },
  six: { 공부방: [D, T, P], 과외쌤: [T, D, P], 학생: [P], 비회원: [P, D, T] },
}[scen];
const BAIT = ['미끼작성자', '미끼본문내용'];
const DEV = ['concern-', 'undefined', 'null', 'NaN', 'search_right_rail', 'intro_only', 'board_key', 'sourceBoardKeys'];
let ok = 0;
const bad = [];
for (const [k, v] of Object.entries(a)) {
  const [s, w, n] = k.split('|');
  const r = v.rail || {};
  const y = b[k].rail || {};
  const c = {};
  if (s === 'find') {
    c.rooms = JSON.stringify(r.rooms) === JSON.stringify(FIND[n]);
    c.best = JSON.stringify(r.best) === JSON.stringify(FIND[n]);
    const own = { 공부방: D, 과외쌤: T }[n] || P;
    const findRooms = FIND[n];
    c.own_first = findRooms.length === 0 || (!!(r.rooms && r.rooms.length) && (r.rooms[0] === own || !findRooms.includes(own)));
    const nr = (o) => (o || '').split('|').filter((x) => x !== 'live-rail-slot--room');
    const want = findRooms.length
      ? nr(y.order)
      : nr(y.order).filter((x) => x !== 'live-rail-slot--best' && x !== 'live-rail-slot--field');
    c.order = JSON.stringify(nr(r.order)) === JSON.stringify(want);
    c.room_slots = (r.order || '').split('|').filter((x) => x === 'live-rail-slot--room').length === findRooms.length;
    const p = v.pop && Object.keys(v.pop).length ? v.pop : {};
    c.pop = Object.keys(p).length > 0 || findRooms.length === 0;
    if (n === '비회원') {
      const txt = (r.text || '') + (p.text || '');
      c.no_author = !txt.includes(BAIT[0]);
      c.no_body = !txt.includes(BAIT[1]) && !p.body;
    }
  } else {
    c.home_same =
      JSON.stringify([r.rooms, r.best, r.order]) === JSON.stringify([y.rooms, y.best, y.order]);
    c.home_text = r.text === y.text;
  }
  const txt = (r.text || '') + ((v.pop || {}).text || '');
  c.no_dev = !DEV.some((t) => txt.includes(t));
  if (Object.values(c).every(Boolean)) ok += 1;
  else bad.push([k, Object.entries(c).filter(([, t]) => !t).map(([x]) => x)]);
}
console.log(`${ok}/${Object.keys(a).length} PASS`, JSON.stringify(bad));
