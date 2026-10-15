import { geocodeBusinessAddress } from '../../shared/naver-map.js';

/**
 * 2026-10-16 운영 조회에서 좌표가 비어 있던 방.
 * 13번은 이미 좌표가 있어 넣지 않는다.
 * 주소는 address_text만 쓴다.
 */
const ROOMS = [
  { id: 6, address_text: '경기 의정부시 능곡로26번길 40 (신곡동, 건영아파트)' },
  { id: 10, address_text: '부산 해운대구 중동2로 11 (중동)' },
  { id: 11, address_text: '경기 성남시 분당구 분당로 50 (수내동)' },
  { id: 12, address_text: '경남 김해시 계동로102번길 9 (대청동, 갑오마을주공2단지)' },
];

function formatCoord(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return '';
  const text = n.toFixed(7);
  const value = Number(text);
  if (value < -180 || value > 180) return '';
  return text;
}

function updateSql(id, latitude, longitude) {
  return [
    'UPDATE study_rooms',
    `SET latitude = ${latitude}, longitude = ${longitude}`,
    `WHERE id = ${id} AND latitude IS NULL;`,
  ].join('\n');
}

function geocoderReady() {
  return typeof window.naver?.maps?.Service?.geocode === 'function';
}

async function geocodeAddress(address) {
  const first = await geocodeBusinessAddress(address);
  if (first) return first;
  const start = Date.now();
  while (!geocoderReady() && Date.now() - start < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!geocoderReady()) return null;
  return geocodeBusinessAddress(address);
}

async function fill() {
  const tbody = document.querySelector('[data-rows]');
  const sqlBox = document.querySelector('[data-sql]');
  const statements = [];
  tbody.replaceChildren();

  for (const room of ROOMS) {
    const found = await geocodeAddress(room.address_text);
    const latitude = found ? formatCoord(found.latitude) : '';
    const longitude = found ? formatCoord(found.longitude) : '';
    const ok = latitude !== '' && longitude !== '';
    const tr = document.createElement('tr');
    for (const text of [room.id, room.address_text, ok ? latitude : '', ok ? longitude : '', ok ? '찾음' : '못 찾음']) {
      const td = document.createElement('td');
      td.textContent = String(text);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    if (ok) statements.push(updateSql(room.id, latitude, longitude));
  }

  sqlBox.value = statements.join('\n\n');
}

fill().catch(() => {
  const sqlBox = document.querySelector('[data-sql]');
  if (sqlBox) sqlBox.value = '';
});
