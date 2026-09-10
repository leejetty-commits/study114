/**
 * 과외쌤 등록 플로우 — 단계 이동 시 새 창/탭(_blank / window.open) 금지
 * 범위: auth signup-complete tutor CTA · tutor-ui 내부 navigate
 */
import { readFileSync } from 'node:fs';
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

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

const complete = read('preview/auth-ui/src/screens/signup-complete.js');
const lesson = read('preview/tutor-ui/src/screens/step-lesson.js');
const contact = read('preview/tutor-ui/src/screens/step-contact.js');
const saveFlow = read('preview/tutor-ui/src/save-flow.js');
const verifyEmail = read('preview/auth-ui/src/screens/signup-verify-email.js');
const basic = read('preview/auth-ui/src/screens/signup-basic.js');

// —— signup-complete: tutor만 같은 탭 assign
assert(
  complete.includes('window.location.assign(TUTOR_UI_BASE)'),
  'complete: tutor detail CTA uses location.assign(TUTOR_UI_BASE)',
);
assert(
  !complete.includes("window.open(TUTOR_UI_BASE, '_blank')") &&
    !complete.includes('window.open(TUTOR_UI_BASE, "_blank")'),
  'complete: tutor detail CTA must not window.open(TUTOR_UI_BASE, _blank)',
);
assert(
  /if \(role === 'tutor'\) \{\s*window\.location\.assign\(home\);\s*return;/.test(complete),
  'complete: tutor home CTA uses location.assign(home) then return',
);

// —— 이메일 확인 후 / 기본등록: 같은 탭 이동 (window.open 없음)
assert(!verifyEmail.includes('window.open'), 'verify-email: no window.open');
assert(verifyEmail.includes('resolveAfterAuthUrl') || verifyEmail.includes('continueAfterVerified'), 'verify-email: continue uses after-auth redirect');
assert(!basic.includes('window.open'), 'signup-basic: no window.open');
assert(basic.includes("navigate('/signup/complete')"), 'signup-basic: tutor path navigates to complete in-app');

// —— tutor-ui 1→2·완료: hash navigate / location.assign (open 금지)
assert(!lesson.includes('window.open'), 'step-lesson: no window.open');
assert(lesson.includes("saveAndNavigate(registerState, 'lesson', '/register/contact')"), 'step-lesson: same-app navigate to contact');
assert(!contact.includes('window.open'), 'step-contact: no window.open');
assert(saveFlow.includes('navigate(nextPath)'), 'save-flow: navigate once after save');
assert(!saveFlow.includes('window.open'), 'save-flow: no window.open');

const tutorSrc = [
  'preview/tutor-ui/src/main.js',
  'preview/tutor-ui/src/layout.js',
  'preview/tutor-ui/src/save-flow.js',
  'preview/tutor-ui/src/screens/step-lesson.js',
  'preview/tutor-ui/src/screens/step-contact.js',
  'preview/tutor-ui/src/screens/step-detail.js',
];
for (const f of tutorSrc) {
  assert(!read(f).includes('window.open'), `scope: ${f} has no window.open`);
  assert(!read(f).includes('target="_blank"'), `scope: ${f} has no target=_blank`);
}

if (failed > 0) {
  console.error(`\ntutor register same-tab FAILED (${failed})`);
  process.exit(1);
}
console.log('\ntutor register same-tab OK');
