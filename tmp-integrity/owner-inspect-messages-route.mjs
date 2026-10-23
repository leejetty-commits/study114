import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';

async function checkMessagePaths() {
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

  // 1. Check Received messages in #/mypage/messages
  console.log('1. Checking 쪽지함...');
  await page.goto('https://study114.net/#/mypage/messages', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const messagesText = await page.evaluate(() => document.body.innerText.slice(0, 1000));
  console.log('Messages body:', messagesText);

  // 2. Check student search for 이종현학생1
  console.log('2. Checking student search...');
  await page.goto('https://study114.net/search/#/search/student', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const studentCards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.search-card, .student-card, [data-student-id]')).map(c => c.innerText.replace(/\n+/g, ' '));
  });
  console.log('Student cards:', studentCards);

  // 3. Check tutor search for 이종현과외 or 이종현선생2
  console.log('3. Checking tutor search...');
  await page.goto('https://study114.net/search/#/search/tutor', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const tutorCards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.search-card, .tutor-card, [data-tutor-id]')).map(c => c.innerText.replace(/\n+/g, ' '));
  });
  console.log('Tutor cards:', tutorCards);

  await context.close();
  await browser.close();
}

checkMessagePaths().catch(console.error);
