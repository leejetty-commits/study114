/**
 * 과외쌤 가입정보 seed — cities pipe · 활동지역 1~3 · 대표=1 · copy gate
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  validateTutorActivityRegions,
  collectTutorRegionSlots,
} from '../preview/shared/tutor-region-slots.js';

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

const api = readFileSync(resolve(root, 'preview/auth-ui/src/auth-api.js'), 'utf8');
assert(api.includes('cities: data.cities'), 'fetchRegions returns cities');
assert(api.includes('import.meta.env'), 'auth-api DEV failure logging');

const basic = readFileSync(resolve(root, 'preview/auth-ui/src/screens/signup-basic.js'), 'utf8');
assert(basic.includes('과외쌤 가입정보 입력'), 'page title copy');
assert(basic.includes('과외쌤 가입정보'), 'section title copy');
assert(basic.includes('과외 활동을 시작하기 위한 정보를 입력해 주세요.'), 'help copy');
assert(basic.includes('가입정보 저장'), 'submit button copy');
assert(basic.includes('showPrimary: false'), 'signup hides primary radio');
assert(basic.includes('validateTutorActivityRegions'), 'client validates activity regions');
assert(basic.includes('saved_regions'), 'payload includes saved_regions');

const slotsUi = readFileSync(resolve(root, 'preview/shared/tutor-region-slots.js'), 'utf8');
assert(slotsUi.includes('validateTutorActivityRegions'), 'shared validator exported');
assert(slotsUi.includes('showPrimary'), 'primary UI optional');

const svc = readFileSync(resolve(root, 'src/Auth/BasicRegisterService.php'), 'utf8');
assert(svc.includes('normalizeTutorSignupRegions'), 'server normalizes tutor signup regions');
assert(svc.includes('활동지역 1을 선택해 주세요'), 'server requires activity region 1');
assert(svc.includes('활동지역이 중복되었습니다'), 'server rejects duplicate regions');
assert(svc.includes('$order === 0 ? 1 : 0'), 'server marks first saved region primary');

const endpoint = readFileSync(resolve(root, 'public/api/auth/basic-register.php'), 'utf8');
assert(
  /InvalidArgumentException[\s\S]*http_response_code\(200\)/.test(endpoint),
  'validation returns HTTP 200 + ok:false',
);

// A: region 1 only
{
  const r = validateTutorActivityRegions([
    { region_id: '11', is_primary: true },
    { region_id: '', is_primary: false },
    { region_id: '', is_primary: false },
  ]);
  assert(r.ok === true && r.slots.length === 1 && r.slots[0].is_primary, 'A: slot1 only OK + primary');
}

// B: 1·2
{
  const r = validateTutorActivityRegions([
    { region_id: '11', is_primary: false },
    { region_id: '22', is_primary: true },
    { region_id: '', is_primary: false },
  ]);
  assert(r.ok === true && r.slots.length === 2 && r.slots[0].region_id === '11' && r.slots[0].is_primary, 'B: two slots, primary forced to first');
}

// C: 1·2·3
{
  const r = validateTutorActivityRegions([
    { region_id: '11' },
    { region_id: '22' },
    { region_id: '33' },
  ]);
  assert(r.ok === true && r.slots.length === 3, 'C: three slots');
}

// D: only slot2
{
  const r = validateTutorActivityRegions([
    { region_id: '' },
    { region_id: '22' },
    { region_id: '' },
  ]);
  assert(r.ok === false && r.index === 0, 'D: slot1 missing blocked');
}

// E: empty 2·3
{
  const r = validateTutorActivityRegions([{ region_id: '11' }, { region_id: '' }, { region_id: '' }]);
  assert(r.ok === true && r.slots.length === 1, 'E: empty 2·3 OK');
}

// F: duplicate
{
  const r = validateTutorActivityRegions([
    { region_id: '11' },
    { region_id: '11' },
    { region_id: '' },
  ]);
  assert(r.ok === false && /중복|이미/.test(r.message || ''), 'F: duplicate blocked');
}

// G: reject fake metro-* id
{
  const r = validateTutorActivityRegions([
    { region_id: 'metro-11' },
    { region_id: '' },
    { region_id: '' },
  ]);
  assert(r.ok === false, 'G: metro-* fake id rejected');
}

assert(typeof collectTutorRegionSlots === 'function', 'collectTutorRegionSlots exported');

if (failed > 0) {
  console.error(`\ntutor signup seed gate FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor signup seed gate OK');
