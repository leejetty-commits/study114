import { STATE_FILE, BASE_URL, chromium } from './common.mjs';

async function verifyDown() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_FILE, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const homeText = await page.innerText('body');
  const isStillInHome = homeText.includes('[테스트] 동네인사 확인');
  console.log('Is test greeting still visible in Home:', isStillInHome);

  const apiRes = await page.evaluate(async () => {
    const r = await fetch('/api/neighborhood-greetings.php');
    return await r.json();
  });
  console.log('Public greetings items count:', apiRes.items?.length);
  const tutor9InPublic = apiRes.items?.some(it => it.registration_id === 9 && it.status === 'up');
  console.log('Is tutor 9 "up" in public list:', tutor9InPublic);

  await browser.close();
}

verifyDown().catch(console.error);
