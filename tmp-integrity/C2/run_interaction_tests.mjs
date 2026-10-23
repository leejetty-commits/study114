import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C2';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // 안전장치
  const blockedCalls = [];
  await page.route('**/api/**', (route, request) => {
    const method = request.method();
    const url = request.url();
    if (method !== 'GET') {
      if (url.includes('/api/search/search.php')) {
        route.continue();
      } else {
        console.warn(`[SAFETY BLOCKED NON-GET] ${method} ${url}`);
        blockedCalls.push({ method, url });
        route.abort('blockedbyclient');
      }
    } else {
      route.continue();
    }
  });

  const report = {
    currentValues: {},
    interactions: {},
    dialogs: [],
    consoleErrors: [],
    pageErrors: [],
  };

  page.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push({ url: page.url(), text: msg.text() });
  });
  page.on('pageerror', err => {
    report.pageErrors.push({ url: page.url(), message: err.message });
  });
  page.on('dialog', async dialog => {
    report.dialogs.push({ type: dialog.type(), message: dialog.message() });
    await dialog.dismiss();
  });

  // 1. 과외 허브(9) 및 현재 값 추출
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const hubData = await page.evaluate(() => {
    const profileText = document.querySelector('.p21-profile')?.innerText || document.body.innerText;
    return {
      title: document.querySelector('.mypage-content__title')?.innerText || '',
      profileTextSnippet: profileText.slice(0, 800),
    };
  });
  report.currentValues.hub = hubData;

  // 2. 기본정보(basic) 추출 및 인터랙션 테스트
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/basic`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const basicData = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
      name: el.name || el.id,
      value: el.value,
      type: el.type,
      disabled: el.disabled,
    }));
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.type === 'submit' || b.classList.contains('btn--save') || b.classList.contains('btn--primary') || b.innerText.includes('저장')
    );
    return {
      inputs,
      saveButton: saveBtn ? { text: saveBtn.innerText, disabled: saveBtn.disabled || saveBtn.hasAttribute('disabled') } : null,
    };
  });
  report.currentValues.basic = basicData;

  // basic 인터랙션: 입력칸 타이핑 및 지역 셀렉트박스 변경 (저장 버튼 누르지 않음)
  try {
    const nameInput = await page.$('input[name="tutor_display_name"]');
    if (nameInput) {
      await nameInput.fill('테스트입력값');
      report.interactions.basicInputFill = 'success';
    }
    const sidoSelect = await page.$('select[name="sido"], select.sido-select, select');
    if (sidoSelect) {
      const options = await sidoSelect.$$eval('option', opts => opts.map(o => o.value));
      report.interactions.sidoOptionsCount = options.length;
    }
  } catch (e) {
    report.interactions.basicError = e.message;
  }

  // 이탈 시 확인창 뜨는지 확인
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/detail`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 3. 상세정보(detail) 추출 및 인터랙션
  const detailData = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
      name: el.name || el.id,
      value: el.value,
      type: el.type,
      disabled: el.disabled,
    }));
    const saveBtn = document.querySelector('button[type="submit"], .btn--save, button.btn--primary');
    return {
      inputs,
      saveButton: saveBtn ? { text: saveBtn.innerText, disabled: saveBtn.disabled || saveBtn.hasAttribute('disabled') } : null,
    };
  });
  report.currentValues.detail = detailData;

  // detail 인터랙션: 소개글 텍스트영역 타이핑
  try {
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.fill('새로운 소개글 테스트');
      report.interactions.detailTextareaFill = 'success';
    }
  } catch (e) {
    report.interactions.detailError = e.message;
  }

  // 4. 쪽지설정(inquiries) 추출 및 인터랙션
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/inquiries`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const inquiriesData = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('input[type="radio"]')).map(r => ({
      name: r.name,
      value: r.value,
      checked: r.checked,
      id: r.id,
      labelText: r.closest('label')?.innerText.trim() || '',
    }));
    const textareas = Array.from(document.querySelectorAll('textarea, input[type="text"]')).map(t => ({
      name: t.name || t.id,
      value: t.value,
      placeholder: t.placeholder,
    }));
    const saveBtn = document.querySelector('button[type="submit"], button.btn--primary, .inquiry-save-btn');
    const statusBox = document.querySelector('.inquiry-current-status, .current-status, .p21-inquiries__status')?.innerText || '';
    return {
      radios,
      textareas,
      statusBoxText: statusBox,
      saveButton: saveBtn ? { text: saveBtn.innerText, disabled: saveBtn.disabled || saveBtn.hasAttribute('disabled') } : null,
      bodyTextSnippet: document.body.innerText.slice(0, 800),
    };
  });
  report.currentValues.inquiries = inquiriesData;

  // 5. 등록점검(publish) 완성도 수치 및 체크리스트
  await page.goto(`${BASE_URL}/#/mypage/registrations/tutors/9/publish`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const publishData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.reg-check-tier, .tier-card, .readiness-card, .p21-publish__card')).map(c => ({
      title: c.querySelector('h3, h4, .tier-title')?.innerText || '',
      score: c.querySelector('.score, .percent, .badge')?.innerText || '',
      desc: c.innerText.slice(0, 150),
    }));
    const checklist = Array.from(document.querySelectorAll('.checklist-item, li, .status-item')).map(li => li.innerText.trim()).filter(t => t.length > 0 && t.length < 80);
    return {
      cards,
      checklistSnippet: checklist.slice(0, 20),
      bodyTextSnippet: document.body.innerText.slice(0, 1000),
    };
  });
  report.currentValues.publish = publishData;

  // 6. contact 화면 모달 열기/닫기 테스트
  await page.goto(`${BASE_URL}/#/mypage/contact`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  try {
    const newContactBtn = await page.$('button:has-text("새 운영문의 남기기"), a:has-text("새 운영문의 남기기"), button:has-text("문의하기")');
    if (newContactBtn) {
      await newContactBtn.click();
      await page.waitForTimeout(1000);
      const modalVisible = await page.$('.modal, .contact-dialog, .support-modal, [role="dialog"]');
      report.interactions.contactModalOpened = !!modalVisible;
      if (modalVisible) {
        await page.screenshot({ path: `${OUT_DIR}/screenshots/pc/contact_modal_open.png` });
        const closeBtn = await page.$('.modal__close, .dialog-close, button:has-text("닫기"), button:has-text("취소")');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(500);
          report.interactions.contactModalClosed = true;
        }
      }
    }
  } catch (e) {
    report.interactions.contactError = e.message;
  }

  // 7. account 화면 표시명 수정 인라인 토글 테스트
  await page.goto(`${BASE_URL}/#/mypage/account`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  try {
    const editBtn = await page.$('button:has-text("표시명 수정")');
    if (editBtn) {
      await editBtn.click();
      await page.waitForTimeout(1000);
      const nameInputVisible = await page.$('input[name="display_name"], input.account-name-input');
      report.interactions.accountEditInputVisible = !!nameInputVisible;
      await page.screenshot({ path: `${OUT_DIR}/screenshots/pc/account_edit_open.png` });
      const cancelBtn = await page.$('button:has-text("취소")');
      if (cancelBtn) {
        await cancelBtn.click();
        await page.waitForTimeout(500);
        report.interactions.accountEditCancelled = true;
      }
    }
  } catch (e) {
    report.interactions.accountError = e.message;
  }

  await browser.close();

  fs.writeFileSync(`${OUT_DIR}/interaction_report.json`, JSON.stringify(report, null, 2), 'utf-8');
  console.log('Interactions test complete! Output saved to interaction_report.json');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
