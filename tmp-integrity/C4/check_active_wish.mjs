import { STATE_FILE, BASE_URL, chromium } from './common.mjs';

async function check() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STATE_FILE });
  const page = await context.newPage();

  // 1. 홈 화면 (#/tutor)
  await page.goto(`${BASE_URL}/#/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const homeBtns = await page.$$eval('[data-action="wish-toggle"], [data-action="student-wish-toggle"]', els => els.map(e => ({
    action: e.getAttribute('data-action'),
    kind: e.getAttribute('data-item-kind'),
    id: e.getAttribute('data-item-id'),
    studentId: e.getAttribute('data-student-id'),
    disabled: e.disabled
  })));
  console.log('Home active wish buttons:', homeBtns);

  // 2. 검색 화면 (공부방 찾기, 과외쌤 찾기, 학생 찾기)
  await page.goto(`${BASE_URL}/search/#/search/tutor?role=tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const searchTutorBtns = await page.$$eval('[data-action="wish-toggle"], [data-action="student-wish-toggle"]', els => els.map(e => ({
    action: e.getAttribute('data-action'),
    kind: e.getAttribute('data-item-kind'),
    id: e.getAttribute('data-item-id'),
    disabled: e.disabled
  })));
  console.log('Search tutor wish buttons:', searchTutorBtns);

  // 3. 공부방 찾기
  await page.goto(`${BASE_URL}/search/#/search/study-room?role=tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const searchRoomBtns = await page.$$eval('[data-action="wish-toggle"], [data-action="student-wish-toggle"]', els => els.map(e => ({
    action: e.getAttribute('data-action'),
    kind: e.getAttribute('data-item-kind'),
    id: e.getAttribute('data-item-id'),
    disabled: e.disabled
  })));
  console.log('Search room wish buttons:', searchRoomBtns);

  // 4. 학생 찾기
  await page.goto(`${BASE_URL}/search/#/search/student?role=tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const searchStudentBtns = await page.$$eval('[data-action="wish-toggle"], [data-action="student-wish-toggle"]', els => els.map(e => ({
    action: e.getAttribute('data-action'),
    studentId: e.getAttribute('data-student-id'),
    disabled: e.disabled
  })));
  console.log('Search student wish buttons:', searchStudentBtns);

  await browser.close();
}

check().catch(console.error);
