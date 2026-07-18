/**
 * 마켓·결제 Lab 시드 (영카트 쇼핑몰현황 벤치마크)
 * 상품 = 공부방·과외쌤 · 실 PG 없음
 * 알림·문자는 sms-lab-store.js 사용
 */

const KEY = 'study114-admin-marketplace-lab';

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function save(data) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function seed() {
  return {
    kpi: {
      ordersToday: 12,
      paidToday: 8,
      incomplete: 3,
      openInquiries: 5,
      reviewsPending: 2,
      bookmarks: 47,
    },
    sales: [
      { period: '오늘', amount: 428000, orders: 8 },
      { period: '이번 주', amount: 2150000, orders: 41 },
      { period: '이번 달', amount: 8920000, orders: 167 },
    ],
    ranks: [
      { kind: 'study_room', name: '대치중등 공부방', views: 1280, pays: 22 },
      { kind: 'tutor', name: '김과외 (수학)', views: 980, pays: 18 },
      { kind: 'study_room', name: '느린센터 자습실', views: 760, pays: 11 },
      { kind: 'tutor', name: '이과외 (영어)', views: 640, pays: 9 },
    ],
    reviews: [
      {
        id: 'RV-1',
        target: '대치중등 공부방',
        kind: 'study_room',
        author: '학부모A',
        rating: 5,
        body: '관리가 꼼꼼하고 상담이 친절해요.',
        status: 'published',
        at: '2026-07-16',
      },
      {
        id: 'RV-2',
        target: '김과외 (수학)',
        kind: 'tutor',
        author: '학부모B',
        rating: 4,
        body: '진도 맞춤이 좋습니다.',
        status: 'pending',
        at: '2026-07-17',
      },
    ],
    incomplete: [
      {
        id: 'INC-1',
        email: 'parent@example.com',
        product: 'Prime 30일',
        amount: 99000,
        step: '결제창 이탈',
        at: '2026-07-17 21:10',
      },
      {
        id: 'INC-2',
        email: 'room@example.com',
        product: '쪽지권 20회',
        amount: 39000,
        step: '카드 인증 실패',
        at: '2026-07-18 08:02',
      },
      {
        id: 'INC-3',
        email: 'tutor@example.com',
        product: 'Standard 30일',
        amount: 49000,
        step: '가상계좌 미입금',
        at: '2026-07-18 09:15',
      },
    ],
    listings: [
      { id: 'SR-3', kind: 'study_room', name: '대치중등 공부방', status: 'published', region: '대치동' },
      { id: 'TU-12', kind: 'tutor', name: '김과외 (수학)', status: 'published', region: '역삼동' },
      { id: 'SR-4', kind: 'study_room', name: '느린센터 자습실', status: 'hidden', region: '대치동' },
    ],
  };
}

function ensure() {
  const cur = load();
  if (cur) return cur;
  const next = seed();
  save(next);
  return next;
}

export function getMarketplaceLab() {
  return ensure();
}

export function setReviewStatus(id, status) {
  const data = ensure();
  const row = data.reviews.find((r) => r.id === id);
  if (row) row.status = status;
  save(data);
  return data;
}

export function dismissIncomplete(id) {
  const data = ensure();
  data.incomplete = data.incomplete.filter((r) => r.id !== id);
  data.kpi.incomplete = data.incomplete.length;
  save(data);
  return data;
}

export function resetMarketplaceLab() {
  sessionStorage.removeItem(KEY);
  return ensure();
}
