import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function inspectInquiriesSetting() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Users\\jetty\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe'
  });

  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  console.log('Navigating to 쪽지설정...');
  await page.goto('https://study114.net/#/mypage/registrations/study-rooms/7/inquiries', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const settingData = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
      name: el.name,
      type: el.type,
      value: el.value,
      checked: el.checked,
      id: el.id
    }));
    const radioChecked = document.querySelector('input[type="radio"]:checked')?.value || null;
    const bodyText = document.body.innerText.slice(0, 1000);
    return {
      inputs,
      radioChecked,
      bodyText
    };
  });

  console.log('Inquiry setting data:', JSON.stringify(settingData, null, 2));

  // Also check public myshop study-room 7
  console.log('Navigating to public myshop study-room 7...');
  await page.goto('https://study114.net/#/myshop/study-room/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const publicInquiryInfo = await page.evaluate(() => {
    const inquirySection = document.querySelector('.shop-inquiry, .inquiry-status, [data-inquiry-status], .shop-contact');
    return {
      sectionText: inquirySection ? inquirySection.innerText : null,
      fullBodyMatch: document.body.innerText.match(/문의 안내[^\n]*\n[^\n]*/)?.[0] || null
    };
  });
  console.log('Public inquiry info:', JSON.stringify(publicInquiryInfo, null, 2));

  await context.close();
  await browser.close();
}

inspectInquiriesSetting().catch(console.error);
