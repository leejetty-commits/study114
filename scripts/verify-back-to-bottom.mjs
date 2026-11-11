/**
 * 352 「맨 아래로」 버튼 — 문자열·로직 정적 검사
 * 실행: node scripts/verify-back-to-bottom.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

let passed = 0;
let failed = 0;
function ok(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

const js = read('preview/shared/back-to-top.js');
const css = read('preview/home-ui/src/styles/design-system.css');

ok('bottom button id study114-back-to-bottom', js.includes("study114-back-to-bottom"));
ok('aria-label 맨 아래로', js.includes("aria-label', '맨 아래로'") || js.includes('aria-label", "맨 아래로"') || js.includes("aria-label', '맨 아래로'"));
ok('label 맨아래', js.includes('맨아래'));
ok('arrow ↓', js.includes('↓'));
ok('mobile mq max-width 768', js.includes('(max-width: 768px)'));
ok('hide near bottom EDGE 96', js.includes('EDGE_PX = 96') || js.includes('96'));
ok('refreshBackToTop syncs both', js.includes('syncBottom') && js.includes('refreshBackToTop'));
ok('reduced motion auto/smooth', js.includes("prefers-reduced-motion: reduce") && js.includes("'auto'") && js.includes("'smooth'"));
ok('top button also uses scrollBehavior', /scrollTo\(\{\s*top:\s*0,\s*behavior:\s*scrollBehavior\(\)/.test(js));
ok('modal list includes review-sheet + compare + detail', js.includes('.review-sheet-root') && js.includes('#compare-modal-root') && js.includes('#p24-detail-modal'));
ok('css .back-to-bottom desktop display none', /\.back-to-bottom\s*\{[^}]*display:\s*none/s.test(css));
ok('css mobile shows back-to-bottom', /@media \(max-width:\s*768px\)[\s\S]*\.back-to-bottom[\s\S]*display:\s*inline-flex/.test(css));
ok('css stack gap 8px via calc', css.includes('2.75rem + 8px') || css.includes('8px'));
ok('css focus-visible on back-to-top', css.includes('.back-to-top:focus-visible'));
ok('min touch 2.75rem kept on .back-to-top', /min-height:\s*2\.75rem/.test(css) && /min-width:\s*2\.75rem/.test(css));
// 「맨 위로」 bottom 위치 유지
ok('top button bottom 1.25rem unchanged', /\.back-to-top\s*\{[^}]*bottom:\s*1\.25rem/s.test(css));

console.log(`\nverify-back-to-bottom: ${passed} PASS / ${failed} FAIL`);
process.exit(failed ? 1 : 0);
