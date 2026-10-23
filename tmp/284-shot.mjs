import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, '284-shots');
mkdirSync(out, { recursive: true });
const base = 'http://127.0.0.1:5196/284-preview.html';
const expected = [
  '희망지역 추가값',
  '희망 수업장소',
  '주 회수',
  '1회 수업시간',
  '희망 강의스타일',
  '희망 과외쌤 성별',
  '학생 성별',
  '특이요청사항',
];

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

async function labels(selector) {
  return page.$$eval(selector, (els) => els.map((el) => el.textContent.trim()));
}

async function shot(name) {
  await page.screenshot({ path: join(out, name), fullPage: true });
  const box = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    birthInput: !!document.querySelector('[name="birth_year"]'),
    birthText: document.body.innerText.includes('출생연도'),
  }));
  return box;
}

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${base}?view=detail`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.student-detail-title');
const detailLabels = await labels('.student-detail-label');
const detail1280 = await shot('detail-1280.png');

await page.fill('[name="preferred_region_note"]', '잠실 주변');
const week = await page.$eval('[name="lessons_per_week"]', (el) => {
  const next = [...el.options].map((o) => o.value).find((v) => v && v !== el.value);
  el.value = next;
  return next;
});
const minutes = await page.$eval('[name="minutes_per_lesson"]', (el) => {
  const next = [...el.options].map((o) => o.value).find((v) => v && v !== el.value);
  el.value = next;
  return next;
});
const tutorGender = await page.$eval('[name="preferred_tutor_gender"]', (el) => {
  const next = [...el.options].map((o) => o.value).find((v) => v && v !== el.value);
  el.value = next;
  return next;
});
const gender = await page.$eval('[name="gender"]', (el) => {
  const next = [...el.options].map((o) => o.value).find((v) => v && v !== el.value);
  el.value = next;
  return next;
});
await page.$eval('[name="lesson_places"]', (el) => {
  const boxes = [...el.form.querySelectorAll('[name="lesson_places"]')];
  const off = boxes.find((b) => !b.checked) || boxes[0];
  off.checked = !off.checked;
  off.dispatchEvent(new Event('change', { bubbles: true }));
});
const place = await page.$$eval('[name="lesson_places"]', (els) => els.filter((el) => el.checked).map((el) => el.value));
await page.$eval('[name="teaching_style_badges"]', (el) => {
  const boxes = [...el.form.querySelectorAll('[name="teaching_style_badges"]')];
  const off = boxes.find((b) => !b.checked) || boxes[0];
  off.checked = !off.checked;
  off.dispatchEvent(new Event('change', { bubbles: true }));
});
const styles = await page.$$eval('[name="teaching_style_badges"]', (els) => els.filter((el) => el.checked).map((el) => el.value));
await page.fill('[name="special_request_note"]', '주말 오전');
await page.click('button[type="submit"]');
await page.waitForFunction(() => window.__p284?.()?.preferred_region_note === '잠실 주변');
const afterSave = await page.evaluate(() => window.__p284());

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('[name="preferred_region_note"]');
const afterReload = await page.evaluate(() => ({
  note: document.querySelector('[name="preferred_region_note"]').value,
  week: document.querySelector('[name="lessons_per_week"]').value,
  minutes: document.querySelector('[name="minutes_per_lesson"]').value,
  tutorGender: document.querySelector('[name="preferred_tutor_gender"]').value,
  gender: document.querySelector('[name="gender"]').value,
  request: document.querySelector('[name="special_request_note"]').value,
  places: [...document.querySelectorAll('[name="lesson_places"]')].filter((el) => el.checked).map((el) => el.value),
  styles: [...document.querySelectorAll('[name="teaching_style_badges"]')].filter((el) => el.checked).map((el) => el.value),
  stored: window.__p284(),
}));

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}?view=detail`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.student-detail-title');
const detail390 = await shot('detail-390.png');

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${base}?view=hub`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-profile-section="detail"]');
const hubLabels = await labels('[data-profile-section="detail"] .p21-profile__label');
const hubValues = await page.$$eval('[data-profile-section="detail"] .p21-profile__row', (rows) =>
  rows.map((row) => ({
    label: row.querySelector('.p21-profile__label')?.textContent.trim(),
    value: row.querySelector('.p21-profile__value')?.textContent.trim(),
  })),
);
const hub1280 = await shot('profile-1280.png');
await page.setViewportSize({ width: 390, height: 844 });
const hub390 = await shot('profile-390.png');

console.log(JSON.stringify({
  detailLabels,
  expectedMissing: expected.filter((label) => !detailLabels.includes(label)),
  extraDetail: detailLabels.filter((label) => !expected.includes(label)),
  detail1280,
  detail390,
  chosen: { week, minutes, tutorGender, gender, place, styles },
  afterSave: {
    birth_year: afterSave?.birth_year,
    preferred_region_note: afterSave?.preferred_region_note,
    lessons_per_week: afterSave?.lessons_per_week,
    minutes_per_lesson: afterSave?.minutes_per_lesson,
    preferred_tutor_gender: afterSave?.preferred_tutor_gender,
    gender: afterSave?.gender,
    special_request_note: afterSave?.special_request_note,
    lesson_places: afterSave?.lesson_places,
    teaching_style_badges: afterSave?.teaching_style_badges,
  },
  afterReload,
  hubLabels,
  hubValues,
  hub1280,
  hub390,
  errors,
}, null, 2));

await browser.close();
