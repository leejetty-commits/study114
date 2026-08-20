/**
 * 공부방 카드 기본 이미지 SVG (UTF-8) — basic 1:1 / pick 1:1 / prime 16:9
 * node scripts/build-room-card-defaults.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const C = {
  u: '#e85d75',
  dong: '#f57c00',
  gong: '#2b7fff',
  gwa: '#8b5cf6',
  ink: '#334155',
  mute: '#64748b',
  pin: '#ff8a65',
  wood: '#e8c39e',
  lead: '#334155',
  hole: '#1e293b',
};

/** 연필+핀 심벌 (기준 좌표 50,55 근처) */
function pinIcon(cx, cy, s) {
  const t = (x, y) => [+(cx + ((x - 50) * s) / 100).toFixed(2), +(cy + ((y - 55) * s) / 100).toFixed(2)];
  const [x1, y1] = t(50, 8);
  const [xr, yr] = t(78, 40);
  const [xl, yl] = t(22, 40);
  const [xrb, yrb] = t(62, 76);
  const [xlb, ylb] = t(38, 76);
  const [xt, yt] = t(50, 98);
  const [hx, hy] = t(50, 36);
  const r = +((17 * s) / 100).toFixed(2);
  const sw = +((2.4 * s) / 100).toFixed(2);
  const [wx1, wy1] = t(41, 76);
  const [wx2, wy2] = t(59, 76);
  return `
  <g aria-hidden="true">
    <path d="M${x1} ${y1}
      C${xr} ${y1 + 4} ${xr} ${yr} ${xr} ${yr}
      L${xrb} ${yrb} L${xt} ${yt} L${xlb} ${ylb} L${xl} ${yl}
      C${xl} ${yl} ${xl} ${y1 + 4} ${x1} ${y1} Z"
      fill="${C.pin}" stroke="${C.hole}" stroke-width="${sw}" stroke-linejoin="round"/>
    <circle cx="${hx}" cy="${hy}" r="${r}" fill="${C.hole}"/>
    <path d="M${wx1} ${wy1} L${wx2} ${wy2} L${xt} ${yt} Z" fill="${C.wood}" stroke="${C.hole}" stroke-width="${+(sw * 0.7).toFixed(2)}" stroke-linejoin="round"/>
  </g>`;
}

function brandWord(cx, y, size) {
  const gap = size * 1.08;
  const chars = [
    ['우', C.u],
    ['동', C.dong],
    ['공', C.gong],
    ['과', C.gwa],
  ];
  const start = cx - gap * 1.5;
  return chars
    .map(
      ([ch, fill], i) =>
        `<text x="${+(start + i * gap).toFixed(1)}" y="${y}" fill="${fill}" font-size="${size}" font-weight="800" text-anchor="middle" font-family="Pretendard, 'Noto Sans KR', sans-serif">${ch}</text>`,
    )
    .join('\n    ');
}

function squareShell(tint) {
  return `  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="${tint}"/>
    </linearGradient>
  </defs>
  <rect width="720" height="720" fill="url(#bg)"/>
  <rect x="28" y="28" width="664" height="664" rx="40" fill="#ffffff" fill-opacity="0.78" stroke="#e2e8f0" stroke-width="2"/>`;
}

const basic = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720" role="img" aria-label="우동공과 우리동네 공부방 과외">
${squareShell('#eef4fb')}
  ${pinIcon(360, 175, 150)}
  ${brandWord(360, 400, 74)}
  <text x="360" y="478" fill="${C.ink}" font-size="34" font-weight="700" text-anchor="middle" font-family="Pretendard, 'Noto Sans KR', sans-serif">우리동네</text>
  <text x="360" y="528" fill="${C.mute}" font-size="30" font-weight="600" text-anchor="middle" font-family="Pretendard, 'Noto Sans KR', sans-serif">공부방 과외</text>
</svg>
`;

const pick = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720" role="img" aria-label="우동공과 우리동네 공부방 과외">
${squareShell('#f5f3ff')}
  ${pinIcon(360, 175, 150)}
  ${brandWord(360, 400, 74)}
  <text x="360" y="478" fill="${C.ink}" font-size="34" font-weight="700" text-anchor="middle" font-family="Pretendard, 'Noto Sans KR', sans-serif">우리동네</text>
  <text x="360" y="528" fill="${C.mute}" font-size="30" font-weight="600" text-anchor="middle" font-family="Pretendard, 'Noto Sans KR', sans-serif">공부방 과외</text>
</svg>
`;

const prime = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="우동공과 우리동네 공부방 과외">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="56" y="80" width="1168" height="560" rx="36" fill="#ffffff" fill-opacity="0.78" stroke="#e2e8f0" stroke-width="2"/>
  ${pinIcon(230, 360, 220)}
  ${brandWord(560, 330, 82)}
  <text x="860" y="300" fill="${C.ink}" font-size="42" font-weight="700" text-anchor="start" font-family="Pretendard, 'Noto Sans KR', sans-serif">우리동네</text>
  <text x="860" y="362" fill="${C.mute}" font-size="38" font-weight="600" text-anchor="start" font-family="Pretendard, 'Noto Sans KR', sans-serif">공부방 과외</text>
</svg>
`;

const dirs = [
  'public/assets/brand',
  'preview/home-ui/public/assets/brand',
  'preview/auth-ui/public/assets/brand',
];

for (const dir of dirs) {
  const full = path.join(root, dir);
  fs.mkdirSync(full, { recursive: true });
  fs.writeFileSync(path.join(full, 'room-card-default-basic.svg'), basic, 'utf8');
  fs.writeFileSync(path.join(full, 'room-card-default-pick.svg'), pick, 'utf8');
  fs.writeFileSync(path.join(full, 'room-card-default-prime.svg'), prime, 'utf8');
}

const check = fs.readFileSync(path.join(root, 'public/assets/brand/room-card-default-basic.svg'), 'utf8');
if (!check.includes('우동공과') || !check.includes('우리동네') || !check.includes('공부방 과외')) {
  console.error('UTF-8 check failed');
  process.exit(1);
}
console.log('OK: basic/pick/prime SVG written to', dirs.join(', '));
