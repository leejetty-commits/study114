import { createRequire } from 'node:module';
const { chromium } = createRequire('d:/work/study114/package.json')('playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
await page.goto('http://127.0.0.1:5174/#/guest', { waitUntil: 'networkidle' });
const out = await page.evaluate(() => {
  const host = document.createElement('div');
  host.innerHTML = `
    <div class="home-app home-app--mypage home-app--role-study_room"><div class="mp-room">
      <a class="mp-room__tab is-active">마이샵</a><a class="mp-room__tab">기본</a>
    </div></div>
    <div class="home-app home-app--mypage home-app--role-tutor"><div class="mp-room">
      <a class="mp-room__tab is-active">마이프로필</a><a class="mp-room__tab">기본</a>
    </div></div>`;
  document.body.appendChild(host);
  const read = (root) => {
    const active = root.querySelector('.is-active');
    const s = getComputedStyle(active);
    return {
      gap: getComputedStyle(root.querySelector('.mp-room')).gap,
      size: s.fontSize,
      pad: s.padding,
      weight: s.fontWeight,
      color: s.color,
    };
  };
  return {
    room: read(host.querySelector('.home-app--role-study_room')),
    tutor: read(host.querySelector('.home-app--role-tutor')),
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
