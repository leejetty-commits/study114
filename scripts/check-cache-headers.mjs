#!/usr/bin/env node
/**
 * 게스트 등록 SPA 캐시 헤더 패치안 검증 (로컬 .htaccess + 선택적 라이브 HEAD)
 * 배포 전제 아님. 라이브는 before(현재 운영) 스냅샷용.
 *
 * Usage:
 *   node scripts/check-cache-headers.mjs
 *   node scripts/check-cache-headers.mjs --live
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htaccessPath = resolve(root, 'public/.htaccess');
const live = process.argv.includes('--live');
const origin = 'https://study114.net';

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

/** @param {string} text */
function assertHtaccess(text) {
  if (!text.includes('public, max-age=31536000, immutable')) {
    fail('.htaccess missing immutable Cache-Control for hashed assets');
  } else {
    ok('hashed asset immutable directive present');
  }

  if (!/\^index-\[A-Za-z0-9_-\]\+\\\.\(js\|css\)\$/.test(text) && !text.includes('^index-[A-Za-z0-9_-]+\\.(js|css)$')) {
    fail('FilesMatch pattern for index-<hash>.(js|css) not found');
  } else {
    ok('FilesMatch limited to index-<hash>.js|css (not blanket *.(js|css))');
  }

  if (!text.includes('no-cache, no-store, must-revalidate')) {
    fail('current HTML no-store policy missing (must remain active this round)');
  } else {
    ok('HTML no-store still active (완화 초안은 주석)');
  }

  if (!text.includes('s-maxage=60') || !text.includes('stale-while-revalidate=30')) {
    fail('HTML relaxation draft (s-maxage / swr) comment missing');
  } else {
    ok('HTML relaxation draft present as comment');
  }

  // Active (non-comment) HTML block must not already use s-maxage
  const withoutComments = text
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
  if (/FilesMatch "\\\.\(html\|htm\)\$"[\s\S]*?s-maxage=60/.test(withoutComments)) {
    fail('HTML s-maxage appears active — this round must keep draft commented only');
  } else {
    ok('HTML s-maxage not active (draft only)');
  }
}

/** @param {string} url */
async function head(url) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20000);
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ac.signal });
    return {
      url,
      status: res.status,
      cache: res.headers.get('cache-control') || '',
      cf: res.headers.get('cf-cache-status') || '',
      length: res.headers.get('content-length') || '',
    };
  } catch (err) {
    return { url, status: 0, cache: '', cf: '', length: '', error: String(err?.message || err) };
  } finally {
    clearTimeout(t);
  }
}

async function probeLive() {
  const homeHtml = await head(`${origin}/`);
  const roomHtml = await head(`${origin}/register/room/`);
  // Discover hashed asset names from HTML when possible
  let jsUrl = `${origin}/assets/index-zG8GDBsI.js`;
  let cssUrl = null;
  let roomJs = `${origin}/register/room/assets/index-B3Z4U1zu.js`;
  try {
    const html = await fetch(`${origin}/register/room/`, { signal: AbortSignal.timeout(25000) }).then((r) =>
      r.text(),
    );
    const mJs = html.match(/\/register\/room\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
    const mCss = html.match(/\/register\/room\/assets\/(index-[A-Za-z0-9_-]+\.css)/);
    if (mJs) roomJs = `${origin}/register/room/assets/${mJs[1]}`;
    if (mCss) cssUrl = `${origin}/register/room/assets/${mCss[1]}`;
  } catch {
    /* keep defaults */
  }
  try {
    const home = await fetch(`${origin}/`, { signal: AbortSignal.timeout(25000) }).then((r) => r.text());
    const m = home.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
    const c = home.match(/\/assets\/(index-[A-Za-z0-9_-]+\.css)/);
    if (m) jsUrl = `${origin}/assets/${m[1]}`;
    if (c) cssUrl = cssUrl || `${origin}/assets/${c[1]}`;
  } catch {
    /* keep defaults */
  }

  const rows = [await head(jsUrl), cssUrl ? await head(cssUrl) : null, await head(roomJs), homeHtml, roomHtml].filter(
    Boolean,
  );

  console.log('\n--- live HEAD (before deploy; expected still old asset TTL / HTML no-store) ---');
  console.log('url\tstatus\tcache-control\tcf-cache-status\tcontent-length');
  for (const r of rows) {
    console.log(
      `${r.url}\t${r.status}\t${r.cache || r.error || '-'}\t${r.cf || '-'}\t${r.length || '-'}`,
    );
  }
  console.log(
    '\nAfter this patch is deployed, hashed JS/CSS should show: public, max-age=31536000, immutable',
  );
}

if (!existsSync(htaccessPath)) {
  fail(`missing ${htaccessPath}`);
  process.exit(1);
}

const text = readFileSync(htaccessPath, 'utf8');
console.log(`Checking ${htaccessPath}`);
assertHtaccess(text);

if (live) {
  await probeLive();
} else {
  console.log('\n(skip live) pass --live to HEAD study114.net for before snapshot');
}
