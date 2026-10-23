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
  let tutorData = null;
  let meData = null;

  page.on('response', async (res) => {
    if (res.url().includes('/api/registrations/tutors.php')) {
      tutorData = await res.json().catch(() => null);
    }
    if (res.url().includes('/api/auth/me.php')) {
      meData = await res.json().catch(() => null);
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // We only print relevant non-secret metadata (like region_id, tutor id, etc.)
  console.log('me:', {
    user_id: meData?.user?.id || meData?.user?.user_id,
    role_type: meData?.user?.role_type,
  });

  if (tutorData && tutorData.items) {
    console.log('tutor items count:', tutorData.items.length);
    for (const t of tutorData.items) {
      console.log('tutor item:', {
        id: t.id,
        tutor_display_name: t.tutor_display_name,
        saved_regions: t.saved_regions,
        primary_region_label: t.primary_region_label,
      });
    }
  }

  await browser.close();
}

main().catch(console.error);
