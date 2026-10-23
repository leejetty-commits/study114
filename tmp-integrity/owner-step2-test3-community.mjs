import { createRequire } from 'node:module';
const require = createRequire('file:///d:/work/study114/package.json');
const { chromium } = require('@playwright/test');
import * as path from 'node:path';
import * as fs from 'node:fs';

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state.json';
const SHOTS_DIR = 'd:\\work\\study114\\.wt\\integrity\\tmp-integrity\\shots\\owner';

async function testCommunity() {
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
  page.on('dialog', async d => { await d.accept(); });

  const record = {
    test: '3. 커뮤니티 글쓰기',
    originalValue: '(글 없음)',
    createdPost: {
      title: '[테스트] 무결성 점검 — 곧 삭제',
      body: '[테스트] 자동 점검 글입니다.'
    },
    updatedBody: '[테스트] 자동 점검 글입니다. (수정)',
    commentCreated: false,
    commentDeleted: false,
    postDeleted: false,
    shots: {}
  };

  console.log('--- Step 1: Navigate to Home to ensure Session, then to Board ---');
  await page.goto('https://study114.net/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Go to Community Director
  await page.evaluate(() => { window.location.hash = '#/community/director'; });
  await page.waitForTimeout(2000);

  const shotListBefore = path.join(SHOTS_DIR, 'B-write3-comm-01-list-before.png');
  await page.screenshot({ path: shotListBefore, fullPage: true });
  record.shots.listBefore = shotListBefore;

  console.log('--- Step 2: Go to Compose (/new) ---');
  await page.evaluate(() => { window.location.hash = '#/community/director/new'; });
  await page.waitForTimeout(2000);

  const shotCompose = path.join(SHOTS_DIR, 'B-write3-comm-02-compose-form.png');
  await page.screenshot({ path: shotCompose, fullPage: true });
  record.shots.composeForm = shotCompose;

  // Fill in form
  await page.fill('input[name="title"]', record.createdPost.title);
  await page.fill('textarea[name="body"]', record.createdPost.body);
  await page.waitForTimeout(500);

  console.log('Submitting post...');
  await page.click('button[type="submit"]:has-text("올리기")');
  await page.waitForTimeout(3000);

  console.log('--- Step 3: Check Post Detail ---');
  const detailUrl = page.url();
  console.log('Detail URL after submit:', detailUrl);

  const shotDetailCreated = path.join(SHOTS_DIR, 'B-write3-comm-03-detail-created.png');
  await page.screenshot({ path: shotDetailCreated, fullPage: true });
  record.shots.detailCreated = shotDetailCreated;

  console.log('--- Step 4: Check List Screen for new post ---');
  await page.evaluate(() => { window.location.hash = '#/community/director'; });
  await page.waitForTimeout(2000);

  const shotListWithPost = path.join(SHOTS_DIR, 'B-write3-comm-04-list-with-post.png');
  await page.screenshot({ path: shotListWithPost, fullPage: true });
  record.shots.listWithPost = shotListWithPost;

  // Go back to Detail
  await page.goto(detailUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('--- Step 5: Test Comment if available ---');
  const commentForm = await page.$('form[data-concern-comment-form]');
  if (commentForm) {
    console.log('Writing test comment...');
    const commentInput = await commentForm.$('textarea[name="body"], input[name="body"]');
    if (commentInput) {
      await commentInput.fill('[테스트]');
      await page.waitForTimeout(500);
      const commentSubmit = await commentForm.$('button[type="submit"]');
      if (commentSubmit) {
        await commentSubmit.click();
        await page.waitForTimeout(2500);
        record.commentCreated = true;

        const shotCommentCreated = path.join(SHOTS_DIR, 'B-write3-comm-05-comment-created.png');
        await page.screenshot({ path: shotCommentCreated, fullPage: true });
        record.shots.commentCreated = shotCommentCreated;

        // Delete comment
        console.log('Deleting test comment...');
        const delCommentBtn = await page.$('[data-concern-delete-comment]');
        if (delCommentBtn) {
          await delCommentBtn.click();
          await page.waitForTimeout(1000);
          const confirmDelComment = await page.$('.concern-confirm-slot button:has-text("삭제"), .concern-confirm-slot button.btn--danger');
          if (confirmDelComment) {
            await confirmDelComment.click();
            await page.waitForTimeout(2000);
            record.commentDeleted = true;
            console.log('Comment deleted.');
          }
        }
      }
    }
  } else {
    console.log('No comment form available.');
  }

  console.log('--- Step 6: Test Post Edit ---');
  const editLink = await page.$('a[data-concern-nav*="edit=1"], a:has-text("수정")');
  if (editLink) {
    await editLink.click();
    await page.waitForTimeout(2000);

    const shotEditForm = path.join(SHOTS_DIR, 'B-write3-comm-06-edit-form.png');
    await page.screenshot({ path: shotEditForm, fullPage: true });
    record.shots.editForm = shotEditForm;

    // Append (수정) to body
    const bodyField = await page.$('form[data-concern-edit] textarea[name="body"]');
    if (bodyField) {
      const curBody = await bodyField.inputValue();
      await bodyField.fill(curBody + ' (수정)');
      await page.waitForTimeout(500);

      const saveEditBtn = await page.$('form[data-concern-edit] button[type="submit"]');
      if (saveEditBtn) {
        await saveEditBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    const shotDetailEdited = path.join(SHOTS_DIR, 'B-write3-comm-07-detail-edited.png');
    await page.screenshot({ path: shotDetailEdited, fullPage: true });
    record.shots.detailEdited = shotDetailEdited;
  }

  console.log('--- Step 7: Delete Post ---');
  const deleteBtn = await page.$('[data-concern-delete-post]');
  if (deleteBtn) {
    await deleteBtn.click();
    await page.waitForTimeout(1000);

    const shotDeleteConfirm = path.join(SHOTS_DIR, 'B-write3-comm-08-delete-confirm.png');
    await page.screenshot({ path: shotDeleteConfirm, fullPage: true });
    record.shots.deleteConfirm = shotDeleteConfirm;

    const confirmDeleteBtn = await page.$('[data-concern-post-confirm-slot] button.btn--danger, [data-concern-post-confirm-slot] button:has-text("삭제하기")');
    if (confirmDeleteBtn) {
      await confirmDeleteBtn.click();
      console.log('Clicked confirm delete.');
      await page.waitForTimeout(3000);
      record.postDeleted = true;
    }
  }

  console.log('--- Step 8: Verify List Screen after Delete ---');
  await page.evaluate(() => { window.location.hash = '#/community/director'; });
  await page.waitForTimeout(2500);

  const listAfterText = await page.evaluate(() => document.body.innerText);
  const postStillExists = listAfterText.includes('[테스트] 무결성 점검 — 곧 삭제');
  console.log('Post still exists in list?:', postStillExists);
  record.revertedValue = postStillExists ? '글 남아있음 (실패)' : '목록에서 삭제됨 (성공)';

  const shotListReverted = path.join(SHOTS_DIR, 'B-write3-comm-09-list-reverted.png');
  await page.screenshot({ path: shotListReverted, fullPage: true });
  record.shots.listReverted = shotListReverted;

  await context.close();
  await browser.close();

  fs.writeFileSync('d:\\work\\study114\\.wt\\integrity\\tmp-integrity\\owner-write3-comm-result.json', JSON.stringify(record, null, 2), 'utf-8');
  console.log('Community test completed successfully!');
}

testCommunity().catch(err => {
  console.error('Fatal in community test:', err);
  process.exit(1);
});
