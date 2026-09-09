/**
 * study-room basic register — basicRegisterApi import + slot contract gate
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

const basicSrc = readFileSync(resolve(root, 'preview/auth-ui/src/screens/signup-basic.js'), 'utf8');
assert(/import\s*\{[^}]*\bbasicRegisterApi\b[^}]*\}\s*from\s*['\"]\.\.\/auth-api\.js['\"]/.test(basicSrc), 'signup-basic imports basicRegisterApi');
assert(basicSrc.includes('basicRegisterApi(role'), 'signup-basic calls basicRegisterApi');
assert(basicSrc.includes('fetchMeApi'), 'signup-basic still uses fetchMeApi');

const apiSrc = readFileSync(resolve(root, 'preview/auth-ui/src/auth-api.js'), 'utf8');
assert(/export async function basicRegisterApi/.test(apiSrc), 'auth-api exports basicRegisterApi');
assert(apiSrc.includes('/api/auth/basic-register.php'), 'auth-api posts basic-register.php');

const formSrc = readFileSync(resolve(root, 'preview/shared/study-room-basic-form.js'), 'utf8');
assert(formSrc.includes('홍보지역 1(대표)을 선택해 주세요'), 'slot1 required message');
assert(formSrc.includes('(선택)'), 'slots 2·3 marked optional in UI');
assert(/1번은 필수/.test(formSrc) && /2·3번은 선택/.test(formSrc), 'hint: 1 required, 2·3 optional');

// FE validate: only slots that are filled are deep-checked (empty 2·3 not forced)
assert(formSrc.includes('filledIdx'), 'validate iterates filled slots only');

const svc = readFileSync(resolve(root, 'src/Auth/BasicRegisterService.php'), 'utf8');
assert(svc.includes('홍보지역 1(대표)을 선택해 주세요'), 'backend requires promo slot 1');
assert(svc.includes('공부방은 계정당 1개만 등록할 수 있습니다'), 'backend blocks duplicate study_room row');
assert(svc.includes('continue;'), 'backend skips incomplete promo slots');

const me = readFileSync(resolve(root, 'public/api/auth/me.php'), 'utf8');
assert(me.includes('needs_basic_register'), 'me exposes needs_basic_register');

// tutor/student share same call site
assert(/role === 'tutor'|role === 'student'|basicRegisterApi\(role/.test(basicSrc), 'tutor/student share basicRegisterApi path');

assert(existsSync(resolve(root, 'preview/auth-ui/src/auth-api.js')), 'auth-api exists');

// Runtime: optional slots empty must not fail FE validate when slot1 filled
const { validateStudyRoomBasicFields } = await import('../preview/shared/study-room-basic-form.js');

function baseStudyRoomPayload(saved_regions) {
  return {
    study_room_name: '테스트공부방',
    lesson_place_type: 'study_room',
    slogan: '슬로건',
    gender: 'male',
    main_subject_note: '수학',
    primary_school_levels: ['elementary'],
    home_address: '서울시 테스트로 1',
    home_address_zip: '06236',
    address_text: '서울시 테스트로 2',
    address_sido: '서울특별시',
    address_sigungu: '강남구',
    address_bname: '역삼동',
    region_id: '101',
    saved_regions,
  };
}

const slot1 = {
  region_id: '101',
  complex_id: '',
  region_basis_type: 'dong',
  region_label: '서울특별시 강남구 역삼동',
  address_sido: '서울특별시',
  address_sigungu: '강남구',
  address_bname: '역삼동',
  is_primary: true,
};
const emptySlot = {
  region_id: '',
  complex_id: '',
  region_basis_type: 'dong',
  region_label: '',
  address_sido: '',
  address_bname: '',
  is_primary: false,
};

assert(
  validateStudyRoomBasicFields(baseStudyRoomPayload([slot1, emptySlot, emptySlot])) === null,
  'FE: slot1 only → validate OK',
);
assert(
  validateStudyRoomBasicFields(baseStudyRoomPayload([emptySlot, emptySlot, emptySlot])) ===
    '홍보지역 1(대표)을 선택해 주세요.',
  'FE: no slot1 → required error',
);
assert(
  validateStudyRoomBasicFields(
    baseStudyRoomPayload([
      slot1,
      { ...slot1, region_id: '102', region_label: '서울특별시 강남구 논현동', address_bname: '논현동', is_primary: false },
      { ...slot1, region_id: '103', region_label: '서울특별시 강남구 삼성동', address_bname: '삼성동', is_primary: false },
    ]),
  ) === null,
  'FE: slots 1·2·3 → validate OK',
);

if (failed > 0) {
  console.error(`\nstudy-room basic-register gate FAILED (${failed})`);
  process.exit(1);
}
console.log('\nstudy-room basic-register gate OK');
