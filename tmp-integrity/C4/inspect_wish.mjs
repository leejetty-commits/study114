import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';

async function inspectWishButtons() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 검색 화면으로 이동
  console.log('Navigating to Search page...');
  await page.goto(`${BASE_URL}/search/#/search/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-inspect-search-tutor.png'), fullPage: true });

  const buttonsInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(b => ({
      text: b.innerText.trim(),
      className: b.className,
      disabled: b.disabled,
      attributes: Array.from(b.attributes).map(a => `${a.name}="${a.value}"`).join(' ')
    })).filter(b => b.text.includes('♡') || b.text.includes('찜') || b.text.includes('관심') || b.attributes.includes('wish'));
  });

  console.log('Search tutor buttons:', JSON.stringify(buttonsInfo, null, 2));

  // 학생 검색 화면
  console.log('Navigating to Student search...');
  await page.goto(`${BASE_URL}/search/#/search/student`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-inspect-search-student.png'), fullPage: true });

  const studentBtns = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map(b => ({
      text: b.innerText.trim(),
      className: b.className,
      disabled: b.disabled,
      attributes: Array.from(b.attributes).map(a => `${a.name}="${a.value}"`).join(' ')
    })).filter(b => b.text.includes('♡') || b.text.includes('찜') || b.text.includes('관심') || b.attributes.includes('wish'));
  });

  console.log('Search student buttons:', JSON.stringify(studentBtns, null, 2));

  await browser.close();
}

inspectWishButtons().catch(console.error);
