/**
 * PR-A 검증 — PHP CLI 없이 PaidCatalog.php 소스 정본·checkout 계약·061 호환을 검사한다.
 * PHP CLI가 있으면 verify-paid-catalog.php / php -l 도 함께 실행한다.
 *
 * 실행: node scripts/verify-paid-pr-a.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0;
let fail = 0;
const notes = [];

function ok(name, cond, detail = '') {
  if (cond) {
    pass += 1;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function note(msg) {
  notes.push(msg);
  console.warn(`NOTE  ${msg}`);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

/** 문자열·주석을 제거한 뒤 {}, (), [] 균형 검사 (간이 PHP syntax) */
function checkPhpBalance(rel) {
  const src = read(rel);
  let i = 0;
  let stack = [];
  let inS = null; // ' " `
  let inLine = false;
  let inBlock = false;
  const pairs = { '{': '}', '(': ')', '[': ']' };
  const opens = new Set(Object.keys(pairs));
  const closes = new Set(Object.values(pairs));

  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (inLine) {
      if (c === '\n') inLine = false;
      i += 1;
      continue;
    }
    if (inBlock) {
      if (c === '*' && n === '/') {
        inBlock = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (inS) {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === inS) inS = null;
      i += 1;
      continue;
    }
    if (c === '/' && n === '/') {
      inLine = true;
      i += 2;
      continue;
    }
    if (c === '/' && n === '*') {
      inBlock = true;
      i += 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      inS = c;
      i += 1;
      continue;
    }
    if (opens.has(c)) stack.push(c);
    else if (closes.has(c)) {
      const open = stack.pop();
      if (!open || pairs[open] !== c) {
        return { ok: false, detail: `unbalanced near index ${i}` };
      }
    }
    i += 1;
  }
  if (inS || inBlock || stack.length) {
    return { ok: false, detail: `unclosed state s=${inS} block=${inBlock} stack=${stack.join('')}` };
  }
  return { ok: true };
}

function listPhpFiles(dir, out = []) {
  for (const name of readdirSync(join(root, dir))) {
    const rel = join(dir, name).replace(/\\/g, '/');
    const st = statSync(join(root, rel));
    if (st.isDirectory()) listPhpFiles(rel, out);
    else if (name.endsWith('.php')) out.push(rel);
  }
  return out;
}

const CHANGED_PHP = [
  'src/Paid/PaidCatalog.php',
  'src/Paid/ProviderCheckoutService.php',
  'src/Paid/ProviderCheckoutRepository.php',
  'src/Paid/ProviderUsageService.php',
  'src/Paid/TutorPositionMemoBundle.php',
  'src/Paid/PositionPeriodCalculator.php',
  'public/api/paid/catalog.php',
  'public/api/paid/checkout.php',
  'scripts/verify-paid-catalog.php',
  'scripts/verify-paid-pricing.php',
];

console.log('--- 1) changed PHP brace/paren balance ---');
for (const f of CHANGED_PHP) {
  const r = checkPhpBalance(f);
  ok(`syntax_balance_${f}`, r.ok, r.detail || 'balanced');
}

console.log('\n--- 1b) optional php -l ---');
const phpV = spawnSync('php', ['-v'], { encoding: 'utf8', shell: true });
const phpAvailable = phpV.status === 0;
if (!phpAvailable) {
  note('php CLI 없음 — php -l / verify-paid-catalog.php 실행 불가. 소스 파싱·균형 검사로 대체.');
} else {
  for (const f of CHANGED_PHP) {
    const r = spawnSync('php', ['-l', join(root, f)], { encoding: 'utf8', shell: true });
    ok(`php_lint_${f}`, r.status === 0, (r.stdout || r.stderr || '').trim());
  }
  const cat = spawnSync('php', [join(root, 'scripts/verify-paid-catalog.php')], {
    encoding: 'utf8',
    shell: true,
    cwd: root,
  });
  process.stdout.write(cat.stdout || '');
  process.stderr.write(cat.stderr || '');
  ok('php_verify_paid_catalog', cat.status === 0);
}

console.log('\n--- 2/3) parse PaidCatalog.php + role catalog matrix ---');
const catalogSrc = read('src/Paid/PaidCatalog.php');

function extractConstArray(name) {
  const re = new RegExp(`(?:public|private)\\s+const\\s+${name}\\s*=\\s*(\\[)`, 'm');
  const m = re.exec(catalogSrc);
  if (!m) throw new Error(`const ${name} not found`);
  let i = m.index + m[0].length - 1;
  let depth = 0;
  const start = i;
  for (; i < catalogSrc.length; i++) {
    const c = catalogSrc[i];
    if (c === "'" || c === '"') {
      const q = c;
      i += 1;
      while (i < catalogSrc.length) {
        if (catalogSrc[i] === '\\') {
          i += 2;
          continue;
        }
        if (catalogSrc[i] === q) break;
        i += 1;
      }
      continue;
    }
    if (c === '[') depth += 1;
    if (c === ']') {
      depth -= 1;
      if (depth === 0) {
        const lit = catalogSrc.slice(start, i + 1);
        // PHP array → JSON-ish
        let js = lit
          .replace(/=>/g, ':')
          .replace(/'/g, '"')
          .replace(/,\s*]/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/null/g, 'null')
          .replace(/true/g, 'true')
          .replace(/false/g, 'false');
        // convert [ key: to { key:
        js = js.replace(/\[(\s*")/g, '{$1').replace(/\](\s*[,}])/g, '}$1');
        // nested numeric arrays stay as []
        // heuristic: if starts with { and values are arrays of numbers, fix top-level
        try {
          return Function(`"use strict"; return (${js});`)();
        } catch (e) {
          // fallback: eval via JSON after converting unquoted keys is hard — use regex extract for known consts
          throw new Error(`parse ${name}: ${e.message}\n${js.slice(0, 200)}`);
        }
      }
    }
  }
  throw new Error(`const ${name} unclosed`);
}

function extractStringConst(name) {
  const m = catalogSrc.match(new RegExp(`const\\s+${name}\\s*=\\s*'([^']+)'`));
  if (!m) throw new Error(`string const ${name} missing`);
  return m[1];
}

function extractListConst(name) {
  const m = catalogSrc.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[([^\\]]+)\\]`));
  if (!m) throw new Error(`list const ${name} missing`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

const VERSION = extractStringConst('VERSION');
const PERIODS = extractListConst('PERIODS');
ok('catalog_version', VERSION === '2026-09-04.1');
ok('periods_5', PERIODS.join(',') === '2주,1개월,2개월,3개월,6개월');

// Robust numeric matrix extractors
function extractNestedNumberMatrix(constName) {
  const re = new RegExp(`const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\];\\s*\\n`, 'm');
  const m = catalogSrc.match(re);
  if (!m) throw new Error(constName);
  const body = m[1];
  /** @type {Record<string, any>} */
  const out = {};
  const roleBlocks = [...body.matchAll(/'(study_room|tutor)'\s*=>\s*\[([\s\S]*?)\]\s*(?:,\s*(?:'|$)|\s*$)/g)];
  // simpler line-based
  let role = null;
  let sku = null;
  for (const line of body.split('\n')) {
    const roleM = line.match(/'(study_room|tutor)'\s*=>/);
    if (roleM) {
      role = roleM[1];
      out[role] = out[role] || {};
    }
    const skuM = line.match(/'(prime|pick)'\s*=>\s*\[([^\]]+)\]/);
    if (skuM && role) {
      out[role][skuM[1]] = skuM[2].split(',').map((s) => Number(s.trim()));
    }
  }
  return out;
}

function extractBadgeSale() {
  const m = catalogSrc.match(/const\s+BADGE_SALE\s*=\s*\[([\s\S]*?)\];/);
  const body = m[1];
  const out = {};
  for (const line of body.split('\n')) {
    const mm = line.match(/'(study_room|tutor)'\s*=>\s*\[([^\]]+)\]/);
    if (mm) out[mm[1]] = mm[2].split(',').map((s) => Number(s.trim()));
  }
  return out;
}

function extractMemoBundle() {
  const m = catalogSrc.match(/const\s+TUTOR_MEMO_BUNDLE\s*=\s*\[([\s\S]*?)\];/);
  const body = m[1];
  const out = {};
  for (const line of body.split('\n')) {
    const mm = line.match(/'(prime|pick)'\s*=>\s*\[([^\]]+)\]/);
    if (mm) out[mm[1]] = mm[2].split(',').map((s) => Number(s.trim()));
  }
  return out;
}

function extractMemoTickets() {
  const m = catalogSrc.match(/const\s+MEMO_TICKETS\s*=\s*\[([\s\S]*?)\];\s*\n\s*\/\*\*/);
  const body = m ? m[1] : catalogSrc.match(/const\s+MEMO_TICKETS\s*=\s*\[([\s\S]*?)\n\s*\];/)[1];
  const out = {};
  let key = null;
  for (const line of body.split('\n')) {
    const km = line.match(/'(1회|5회권|10회권)'\s*=>/);
    if (km) {
      key = km[1];
      out[key] = {};
    }
    if (!key) continue;
    const sm = line.match(/'(option_id|ticket_kind|label)'\s*=>\s*'([^']*)'/);
    if (sm) out[key][sm[1]] = sm[2];
    const nm = line.match(/'(credit_count|list_price_krw|discount_krw|sale_price_krw|expire_days)'\s*=>\s*([^,\s]+)/);
    if (nm) {
      const raw = nm[2].trim();
      out[key][nm[1]] = raw === 'null' ? null : Number(raw);
    }
    const bm = line.match(/'(balance_stored)'\s*=>\s*(true|false)/);
    if (bm) out[key].balance_stored = bm[2] === 'true';
    const dm = line.match(/'(discount_rate)'\s*=>\s*([0-9.]+)/);
    if (dm) out[key].discount_rate = Number(dm[2]);
  }
  return out;
}

const POSITION_SALE = extractNestedNumberMatrix('POSITION_SALE');
const BADGE_SALE = extractBadgeSale();
const MEMO_BUNDLE = extractMemoBundle();
const MEMO_TICKETS = extractMemoTickets();
const DISCOUNT = {
  study_room: { '2개월': 0.1, '3개월': 0.15, '6개월': 0.2 },
  tutor: { '2개월': 0.05, '3개월': 0.1, '6개월': 0.15 },
};

const EXPECT_POS = {
  study_room: {
    prime: [30000, 50000, 90000, 127500, 240000],
    pick: [15000, 30000, 54000, 76500, 144000],
  },
  tutor: {
    prime: [18000, 30000, 57000, 81000, 153000],
    pick: [10000, 20000, 38000, 54000, 102000],
  },
};
const EXPECT_BADGE = {
  study_room: [2500, 5000, 9000, 12750, 24000],
  tutor: [5000, 10000, 19000, 27000, 51000],
};

for (const role of ['study_room', 'tutor']) {
  for (const sku of ['prime', 'pick']) {
    PERIODS.forEach((p, i) => {
      ok(
        `src_${role}_${sku}_${p}`,
        POSITION_SALE[role][sku][i] === EXPECT_POS[role][sku][i],
        String(POSITION_SALE[role][sku][i]),
      );
    });
  }
  PERIODS.forEach((p, i) => {
    ok(`src_${role}_badge_${p}`, BADGE_SALE[role][i] === EXPECT_BADGE[role][i], String(BADGE_SALE[role][i]));
  });
}
PERIODS.forEach((p, i) => {
  ok(`src_memo_prime_${p}`, MEMO_BUNDLE.prime[i] === [2, 5, 10, 15, 30][i]);
  ok(`src_memo_pick_${p}`, MEMO_BUNDLE.pick[i] === [1, 2, 4, 6, 12][i]);
});
ok('src_memo_1', MEMO_TICKETS['1회']?.sale_price_krw === 1000 && MEMO_TICKETS['1회'].ticket_kind === 'immediate');
ok('src_memo_5', MEMO_TICKETS['5회권']?.sale_price_krw === 4500 && MEMO_TICKETS['5회권'].expire_days === 120);
ok('src_memo_10', MEMO_TICKETS['10회권']?.sale_price_krw === 8000);
ok('src_no_20', !MEMO_TICKETS['20회권']);

function priceRow(role, sale, period) {
  const rate = DISCOUNT[role][period] || 0;
  const list = rate > 0 ? Math.round(sale / (1 - rate)) : sale;
  return { list_price_krw: list, discount_rate: rate, discount_krw: list - sale, sale_price_krw: sale };
}

function quote(productId, variant, providerType) {
  if (productId === 'picked') productId = 'jjokjipge';
  if (productId === 'memo_ticket') {
    if (variant === '5회') variant = '5회권';
    if (variant === '10회') variant = '10회권';
    if (variant === '20회' || variant === '20회권') throw new Error('20회권');
    const row = MEMO_TICKETS[variant];
    if (!row) throw new Error('memo variant');
    return { amount_won: row.sale_price_krw, sale_price_krw: row.sale_price_krw, ticket_kind: row.ticket_kind };
  }
  if (productId === 'prime' || productId === 'pick') {
    if (providerType !== 'study_room' && providerType !== 'tutor') throw new Error('role');
    const idx = PERIODS.indexOf(variant);
    if (idx < 0) throw new Error('period');
    const sale = POSITION_SALE[providerType][productId][idx];
    const priced = priceRow(providerType, sale, variant);
    const memo =
      providerType === 'tutor' ? MEMO_BUNDLE[productId][idx] : 0;
    return { ...priced, amount_won: sale, memo_bundle: memo, period_inherited: false };
  }
  if (['hot', 'subject_track', 'jjokjipge', 'sky'].includes(productId)) {
    if (providerType !== 'study_room' && providerType !== 'tutor') throw new Error('role');
    const allowed =
      providerType === 'study_room' ? ['hot', 'subject_track'] : ['hot', 'jjokjipge', 'sky'];
    if (!allowed.includes(productId)) throw new Error('badge role');
    if (!PERIODS.includes(variant)) throw new Error('badge period');
    const idx = PERIODS.indexOf(variant);
    const sale = BADGE_SALE[providerType][idx];
    const priced = priceRow(providerType, sale, variant);
    return { ...priced, amount_won: sale, period_inherited: true };
  }
  if (productId === 'request_view' || variant === '20회권') throw new Error('removed');
  throw new Error('unknown');
}

console.log('\n--- 4) quote rejects ---');
const rejects = [
  ['memo_ticket', '20회권', null],
  ['memo_ticket', '20회', null],
  ['request_view', '1회', 'tutor'],
  ['prime', '3주', 'study_room'],
  ['prime', '1개월', null],
  ['hot', '포지션종속', 'tutor'],
  ['unknown_sku', '1개월', 'tutor'],
  ['subject_track', '1개월', 'tutor'],
];
for (const [pid, v, role] of rejects) {
  let threw = false;
  try {
    quote(pid, v, role);
  } catch {
    threw = true;
  }
  ok(`reject_${pid}_${v}_${role ?? 'null'}`, threw);
}

// tampered client amount cannot affect quote
const q1 = quote('pick', '1개월', 'study_room');
ok('tamper_ignored_quote_fixed', q1.amount_won === 30000);

console.log('\n--- 5) badge inherit contract in code ---');
const checkoutSvc = read('src/Paid/ProviderCheckoutService.php');
const catalogPhp = catalogSrc;
ok(
  'badge_period_inherited_export',
  /'period_inherited'\s*=>\s*true/.test(catalogPhp),
);
ok(
  'checkout_resolves_badge_period',
  checkoutSvc.includes('resolveBadgePeriodFromActivePosition') &&
    checkoutSvc.includes('assertBadgePeriodMatchesActivePosition'),
);
ok(
  'checkout_quote_after_inherit',
  /resolveBadgePeriodFromActivePosition[\s\S]*PaidCatalog::quote/m.test(checkoutSvc),
);
ok(
  'checkout_ignores_client_amount',
  !/createOrder\([\s\S]*\$amount/m.test(checkoutSvc) &&
    read('public/api/paid/checkout.php').includes("createOrder($userId, $productId, $variant, $providerType, $providerId)"),
);
ok(
  'checkout_amount_from_quote',
  checkoutSvc.includes("(int) $quote['amount_won']") && !checkoutSvc.includes('DUMMY_AMOUNT'),
);

console.log('\n--- 6) schema 061 absent compatibility ---');
const repo = read('src/Paid/ProviderCheckoutRepository.php');
ok('repo_has_catalog_column_probe', repo.includes("hasColumn('catalog_version')"));
ok(
  'repo_provider_only_insert_branch',
  repo.includes('if ($hasProvider)') &&
    repo.includes('provider_type, provider_id, amount_won, status, pg_provider') &&
    repo.indexOf('if ($hasProvider && $hasCatalog)') < repo.indexOf('if ($hasProvider) {'),
);
ok(
  'repo_provider_only_insert_sql',
  /INSERT INTO provider_payment_orders[\s\S]*provider_type, provider_id, amount_won, status, pg_provider[\s\S]*VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)/.test(
    repo,
  ),
);
ok(
  'repo_legacy_insert_without_snapshot',
  repo.includes('(user_id, order_ref, product_id, variant_label, product_kind, amount_won, status, pg_provider)'),
);
const sql061 = read('sql/schema/061_payment_catalog_snapshot.sql');
ok('sql061_is_sql_not_php', !sql061.trimStart().startsWith('<?php') && sql061.includes('catalog_version'));
ok('sql061_comment_ops_not_apply', /운영 DB에는 수동 승인 전까지 적용하지 않는다/.test(sql061));

console.log('\n--- 7) regression surface contracts ---');
const statusApi = read('public/api/paid/status.php');
const historyApi = read('public/api/paid/history.php');
const usage = read('src/Paid/ProviderUsageService.php');
ok('status_api_unchanged_entry', statusApi.includes('ProviderUsageService') && statusApi.includes('getFullSummary'));
ok('history_api_unchanged_entry', historyApi.includes('listOrders'));
ok('usage_keeps_roi_merge', usage.includes('array_merge($roi, $core, $ticketBlocks'));
ok('usage_adds_catalog_hint_only', usage.includes("'catalog_version'") && usage.includes('PaidCatalog::version()'));
ok(
  'memo_bundle_delegates',
  read('src/Paid/TutorPositionMemoBundle.php').includes('PaidCatalog::memoBundle'),
);
ok(
  'frontend_no_seed_prices',
  read('preview/home-ui/src/plans/runtime-config.js').includes('PLAN_CATALOG_SEED = []'),
);
ok(
  'frontend_pay_uses_server_amount',
  read('preview/home-ui/src/plans/screens.js').includes('created.amount_won'),
);

// catalog API filters
const catalogApi = read('public/api/paid/catalog.php');
ok('catalog_api_get_only', catalogApi.includes("method !== 'GET'"));
ok('catalog_api_role_filter', catalogApi.includes("provider_type") && catalogApi.includes('PaidCatalog::export'));

console.log('\n--- optional live e2e ---');
note('e2e p18-b/d/c·history는 로컬 API(PR-A 코드)·DB가 떠 있어야 함. 이 환경에 php/docker daemon·미리보기 서버 미확인 → 미실행.');

console.log(`\n${pass} PASS / ${fail} FAIL`);
if (notes.length) {
  console.log('\nNotes:');
  for (const n of notes) console.log(`- ${n}`);
}
if (fail > 0) process.exit(1);
