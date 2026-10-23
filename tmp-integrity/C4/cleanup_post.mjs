import { STATE_FILE, BASE_URL, OUT_DIR, SHOTS_DIR, blockedLogs, chromium, setupSafetyRoute } from './common.mjs';
import path from 'path';
import fs from 'fs';

async function cleanupAndCommentTest() {
  console.log('=== Checking and Cleaning up Test Post in Concern-Tutor ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: STATE_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await setupSafetyRoute(page);

  page.on('dialog', async d => {
    console.log('[DIALOG]', d.type(), d.message());
    await d.accept();
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/board/')) {
      console.log(`[BOARD API] ${res.request().method()} ${url} -> ${res.status()}`);
      try {
        const body = await res.text();
        console.log(`[BOARD BODY]`, body.slice(0, 300));
      } catch (e) {}
    }
  });

  // 1. 홈 -> 세션 hydrate
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. 과외쌤 고민방 목록
  await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-debug-list.png'), fullPage: true });

  const postLink = await page.$('text=[테스트]');
  if (!postLink) {
    console.log('No [테스트] post found in list!');
    await browser.close();
    return;
  }

  console.log('Found [테스트] post! Clicking...');
  await postLink.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-debug-detail.png'), fullPage: true });

  // 댓글 입력창 확인
  console.log('Testing comment submission...');
  const commentTextarea = await page.$('.comment-form textarea, textarea[placeholder*="댓글"], textarea');
  if (commentTextarea) {
    await commentTextarea.fill('[테스트] 과외샤 댓글 작성 확인');
    const commentSubmit = await page.$('.comment-form button, button:has-text("댓글 남기기"), button:has-text("등록"), button:has-text("작성")');
    if (commentSubmit) {
      console.log('Submitting comment...');
      await commentSubmit.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SHOTS_DIR, '01-debug-comment-added.png'), fullPage: true });
    }
  }

  // 댓글 삭제 테스트
  const commentDelBtn = await page.$('.comment-item button:has-text("삭제"), .comment-list button:has-text("삭제")');
  if (commentDelBtn) {
    console.log('Deleting comment...');
    await commentDelBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-debug-comment-deleted.png'), fullPage: true });
  }

  // 이제 글 삭제
  console.log('Deleting post...');
  // 글 삭제 버튼: .concern-detail__actions button 또는 상세 본문 하단의 삭제 버튼
  const postDelBtn = await page.$('.concern-detail button:has-text("삭제"), article button:has-text("삭제")');
  if (postDelBtn) {
    console.log('Found post delete button, clicking...');
    await postDelBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-debug-post-deleted.png'), fullPage: true });
  } else {
    console.warn('Post delete button not found!');
  }

  // 목록으로 돌아와서 삭제되었는지 확인
  await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const remainingPost = await page.$('text=[테스트]');
  console.log('Remaining test post found:', !!remainingPost);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-debug-final-list.png'), fullPage: true });

  await browser.close();
}

cleanupAndCommentTest().catch(console.error);
