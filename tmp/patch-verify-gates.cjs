const fs = require('fs');
const path = require('path');

function write(rel, text) {
  fs.writeFileSync(path.resolve(rel), text, 'utf8');
  console.log('wrote', rel, Buffer.byteLength(text), 'bytes');
}

// ========== 1. study-room RC frame ==========
{
  let s = fs.readFileSync('scripts/verify-study-room-registration-check-frame.mjs', 'utf8');

  s = s.replace(
    "assert(screens.includes('getPublishReadiness(room)'), 'screens: publish readiness SSOT unchanged');",
    "assert(!screens.includes('getPublishReadiness'), 'screens: no publish-readiness CTA wiring');\nassert(screens.includes('profileStatus: room.profile_status'), 'screens: passes profileStatus only');",
  );

  s = s.replace(
    "assert(render.includes('rc-publish'), 'render: publish wrap');\nassert(render.includes('rc-publish__summary'), 'render: publish summary above CTA');\nassert(render.includes('data-p20-publish'), 'render: publish CTA');\nassert(render.includes('data-p20-confirm'), 'render: self-check');",
    "assert(!render.includes('rc-publish'), 'render: publish wrap removed');\nassert(!render.includes('rc-publish__summary'), 'render: publish summary removed');\nassert(!render.includes('data-p20-publish'), 'render: publish CTA removed');\nassert(!render.includes('data-p20-confirm'), 'render: self-check removed');",
  );

  s = s.replace(
    "assert(listings.includes('var(--expo-prime-media-height-scale'), 'listings: prime uses height scale');\nassert(listings.includes('100cqw * 9 / 16'), 'listings: prime height from 16:9 base × scale');\nassert(!listings.includes('--expo-prime-media-ratio'), 'listings: no aspect-ratio swap');\nassert(listings.includes('container-name: expo-prime-media'), 'listings: prime media container for cqw');",
    "assert(listings.includes('aspect-ratio: 160 / 117'), 'listings: prime 16:9×1.3 via aspect-ratio (no cqw collapse)');\nassert(!listings.includes('--expo-prime-media-ratio'), 'listings: no aspect-ratio swap token');\nassert(!listings.includes('100cqw * 9 / 16'), 'listings: no cqw prime height');\nassert(!listings.includes('container-name: expo-prime-media'), 'listings: no expo-prime-media cqw container');",
  );

  s = s.replace(
    "assert(pageFn.indexOf('${renderBoard(vm)}') < pageFn.indexOf('${renderPublishActions(vm)}'), 'page: CTA after board');",
    "assert(!pageFn.includes('renderPublishActions'), 'page: publish CTA removed');\nassert(pageFn.indexOf('${renderCards(vm)}') < pageFn.indexOf('${renderBoard(vm)}'), 'page: board after cards');",
  );

  s = s.replace(
    "assert(model.includes(\"id: 'publish'\"), 'model: publish badge');\nassert(model.includes(\"id: 'basic'\"), 'model: basic badge');\nassert(model.includes(\"id: 'pick'\"), 'model: pick badge');\nassert(model.includes(\"id: 'prime'\"), 'model: prime badge');",
    "assert(!model.includes(\"id: 'publish'\"), 'model: no publish badge');\nassert(model.includes(\"id: 'basic'\"), 'model: basic board section');\nassert(model.includes(\"id: 'pick'\"), 'model: pick badge');\nassert(model.includes(\"id: 'prime'\"), 'model: prime badge');",
  );

  s = s.replace(
    "assert(copy.includes(\"publishOk: '공개 가능'\"), 'copy: publish badge');\nassert(copy.includes(\"pickMissingTitle: '[픽] 추가 입력'\"), 'copy: pick title');\nassert(copy.includes(\"detail: '상세정보'\"), 'copy: 상세정보 parent');\nassert(copy.includes(\"detail1: '상세정보1'\"), 'copy: 상세정보1 child');\nassert(copy.includes(\"detail2: '상세정보2'\"), 'copy: 상세정보2 child');\nassert(copy.includes('자기확인 후 공개하기'), 'copy: next publish');\nassert(copy.includes('공개 전 자기확인'), 'copy: self-check title');\nassert(!copy.includes('베이직 검색은 기본정보만으로도 가능합니다'), 'copy: no basic-only claim');\nassert(typeof RC_COPY.next.fill === 'function', 'copy: next.fill helper');\nassert(RC_COPY.next.fill('대표 이미지 1장 이상') === '대표 이미지 1장 이상 입력하러 가기', 'copy: next fill label');\nassert(RC_COPY.publish.summaryNeed(2).includes('2개'), 'copy: publish summary uses count');\nassert(RC_COPY.badges.basicNeed(2) === 'Basic 2개 부족', 'copy: basic remaining chip');",
    "assert(!copy.includes('publishOk') && !/publish\\s*:\\s*\\{/.test(copy), 'copy: no publish CTA block');\nassert(copy.includes(\"pickMissingTitle: '[픽] 추가 입력\"), 'copy: pick title');\nassert(copy.includes(\"detail: '상세정보'\"), 'copy: 상세정보 parent');\nassert(copy.includes(\"detail1: '상세정보1'\"), 'copy: 상세정보1 child');\nassert(copy.includes(\"detail2: '상세정보2'\"), 'copy: 상세정보2 child');\nassert(copy.includes(\"done: '현황만 확인하면 됩니다'\"), 'copy: next done');\nassert(!copy.includes('자기확인'), 'copy: no self-check publish copy');\nassert(!copy.includes('베이직 검색은 기본정보만으로도 가능합니다'), 'copy: no basic-only claim');\nassert(typeof RC_COPY.next.fill === 'function', 'copy: next.fill helper');\nassert(RC_COPY.next.fill('대표 이미지 1장 이상') === '대표 이미지 1장 이상 입력하러 가기', 'copy: next fill label');\nassert(RC_COPY.badges.pickNeed(2) === '픽 추가 2개', 'copy: pick remaining chip');\nassert(RC_COPY.badges.primeNeed(2) === '프라임 추가 2개', 'copy: prime remaining chip');\nassert(typeof RC_COPY.publish === 'undefined', 'copy: RC_COPY.publish undefined (CTA removed)');",
  );

  s = s.replace(
    "assert(edit.includes('[data-p20-publish]'), 'edit: publish CTA handler');\nassert(edit.includes('[data-p20-confirm]'), 'edit: self-check gate');\nassert(edit.includes('publishStudyRoom(roomId)'), 'edit: existing publish action');",
    "assert(!edit.includes('[data-p20-publish]'), 'edit: no publish CTA handler');\nassert(!edit.includes('[data-p20-confirm]'), 'edit: no self-check gate');\nassert(!edit.includes('publishStudyRoom'), 'edit: no publishStudyRoom action');",
  );

  s = s.replace(
    "assert(store.includes(\"id: 'contact', label: '문의·쪽지 방식'\"), 'store: contact item kept');",
    "assert(store.includes(\"id: 'region', label: '활동 지역'\"), 'store: region item kept');\nassert(!store.includes(\"id: 'contact', label: '문의·쪽지 방식'\"), 'store: contact publish item removed');",
  );

  write('scripts/verify-study-room-registration-check-frame.mjs', s);
}

// ========== 2. tutor mypage frame IA ==========
{
  let s = fs.readFileSync('scripts/verify-tutor-mypage-frame-ia.mjs', 'utf8');
  const before = s;
  s = s.replace(
    "assert(mypageRouter.includes(\"label: '찜한학생'\"), 'nav: 찜한학생');",
    "assert(mypageRouter.includes(\"label: '관심 학생'\"), 'nav: 관심 학생');\nassert(!mypageRouter.includes(\"label: '찜한학생'\"), 'nav: 찜한학생 renamed');",
  );
  if (s === before) throw new Error('tutor mypage replace failed');
  write('scripts/verify-tutor-mypage-frame-ia.mjs', s);
}

// ========== 3. tutor register same-tab ==========
{
  let s = fs.readFileSync('scripts/verify-tutor-register-same-tab.mjs', 'utf8');
  const before = s;
  s = s.replace(
    `assert(
  /if \\(role === 'tutor'\\) \\{\\s*window\\.location\\.assign\\(home\\);\\s*return;/.test(complete),
  'complete: tutor home CTA uses location.assign(home) then return',
);`,
    `assert(
  complete.includes('window.location.assign(home)') &&
    !/if \\(role === 'tutor'\\) \\{\\s*window\\.location\\.assign\\(home\\);\\s*return;/.test(complete),
  'complete: shared location.assign(home) for all roles (no tutor-only branch)',
);
assert(
  !complete.includes('window.open(home') && !complete.includes(\"window.open(home\"),
  'complete: home CTA must not window.open',
);`,
  );
  if (s === before) throw new Error('tutor same-tab replace failed');
  write('scripts/verify-tutor-register-same-tab.mjs', s);
}

console.log('all patches applied');
