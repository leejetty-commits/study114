process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright';

import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STORAGE_STATE = 'd:\\work\\study114\\.wt\\_integrity-auth\\state-tutor.json';
const BASE_URL = 'https://study114.net';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();

  const res = await page.request.get('https://study114.net/api/auth/regions.php?action=cities');
  const data = await res.json();
  console.log('Total cities:', data.cities?.length);
  // find id 19, 29, 39, 224
  const ids = [19, 29, 39, 224, 1];
  for (const c of (data.cities || [])) {
    if (ids.includes(Number(c.id))) {
      console.log('City match:', c);
    }
  }

  // Also check what GET /api/registrations/tutors.php returns!
  const tutorRes = await page.request.get('https://study114.net/api/registrations/tutors.php');
  const tutorData = await tutorRes.json();
  console.log('Tutor registrations:', JSON.stringify(tutorData, null, 2));

  await browser.close();
}

main().catch(console.error);
