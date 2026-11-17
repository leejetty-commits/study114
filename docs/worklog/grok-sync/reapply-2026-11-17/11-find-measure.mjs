/**
 * 지시서 11 측정 도구 (비로그인). 커밋 대상 코드가 아니다. 문서와 같이 둔다.
 *
 * 찾기 앱 빌드 결과(dist)를 https://study114.net/search/ 자리에 끼워 넣고, API는 운영 그대로 부른다.
 * 그래서 수정 전 dist 와 수정 후 dist 를 같은 조건에서 비교할 수 있다. 화면을 바꾸는 요청은 보내지 않는다(조회만).
 *
 * 사용:
 *   cd preview/search-ui && VITE_BASE_PATH=/search/ npx vite build --outDir /tmp/find-before   (수정 전, origin/main)
 *   cd preview/search-ui && VITE_BASE_PATH=/search/ npx vite build --outDir /tmp/find-after    (수정 후, 작업 브랜치)
 *   CHROME_PATH=/usr/bin/google-chrome node 11-find-measure.mjs /tmp/find-before room 9
 *   CHROME_PATH=/usr/bin/google-chrome node 11-find-measure.mjs /tmp/find-after  room 9
 *   (탭: room | tutor | student)
 *
 * 출력(중앙값, ms는 문서 시작부터):
 *   fcp      첫 그림(스켈레톤 포함, 브라우저 first-contentful-paint)
 *   me       me.php 응답 시각
 *   heading  #app 에 h1(찾기 제목)이 처음 들어간 시각 = 진짜 첫 글자
 *   last     #app 전체 다시 그리기(innerHTML)의 마지막 시각 = 목록까지 다 그린 시각
 *   renders  #app innerHTML 횟수 (main.js render 횟수)
 *   mounts   그린 HTML 안 data-naver-map-mount 개수 합 = 지도 칸을 새로 만든 횟수
 *   search / regions / rs   search.php / regions.php / region-stats.php 요청 수
 * 필요: playwright-core, Chrome.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2];
const tab = process.argv[3] || 'room';
const runs = Number(process.argv[4] || 5);
if (!dist || !fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('usage: node 11-find-measure.mjs <dist-dir> <room|tutor|student> [runs]');
  process.exit(2);
}
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const rows = [];
for (let i = 0; i < runs; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https:\/\/study114\.net\/search\/(?!api)(.*)$/, (route) => {
    const u = new URL(route.request().url());
    let rel = u.pathname.replace(/^\/search\/?/, '');
    if (!rel || rel.endsWith('/')) rel = 'index.html';
    const f = path.join(dist, rel);
    if (!fs.existsSync(f)) return route.continue();
    const ct = f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': ct, 'cache-control': 'no-store' } });
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__m = { renders: 0, mounts: 0, me: null, heading: null, last: null, regions: 0, search: 0, rs: 0 };
    const of = window.fetch;
    window.fetch = function (u) {
      const s = String((u && u.url) || u);
      if (s.includes('regions.php')) window.__m.regions++;
      if (s.includes('search.php')) window.__m.search++;
      if (s.includes('region-stats.php')) window.__m.rs++;
      const pr = of.apply(this, arguments);
      if (s.includes('me.php')) pr.then(() => { window.__m.me ??= Math.round(performance.now()); });
      return pr;
    };
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: true,
      get() { return desc.get.call(this); },
      set(v) {
        if (this.id === 'app') {
          window.__m.renders++;
          window.__m.last = Math.round(performance.now());
          window.__m.mounts += (String(v).match(/data-naver-map-mount/g) || []).length;
        }
        const r = desc.set.call(this, v);
        if (this.id === 'app' && window.__m.heading == null && this.querySelector('h1')) window.__m.heading = Math.round(performance.now());
        return r;
      },
    });
  });
  await page.goto(`https://study114.net/search/#/search/${tab}`, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => console.log('GOTO', e.message));
  await page.waitForTimeout(2000);
  rows.push(await page.evaluate(() => ({ ...window.__m, fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0) })));
  await ctx.close();
}
const med = (k) => { const v = rows.map((r) => r[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
console.log(JSON.stringify({ dist: path.basename(dist), tab, runs, fcp: med('fcp'), me: med('me'), heading: med('heading'), last: med('last'), renders: med('renders'), mounts: med('mounts'), search: med('search'), regions: med('regions'), rs: med('rs') }));
await browser.close();
