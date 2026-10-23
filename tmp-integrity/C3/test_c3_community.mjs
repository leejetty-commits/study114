import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

process.env.PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/jetty/AppData/Local/ms-playwright';

const req = createRequire('file:///d:/work/study114/package.json');
const { chromium } = req('@playwright/test');

const STATE_FILE = 'd:/work/study114/.wt/_integrity-auth/state-tutor.json';
const BASE_URL = 'https://study114.net';
const OUT_DIR = 'd:/work/study114/.wt/integrity-tutor/tmp-integrity/C3';
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots');

if (!fs.existsSync(SHOTS_DIR)) {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  // Viewport configs: PC & Mobile
  const viewports = [
    { name: 'pc', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844, isMobile: true }
  ];

  for (const vp of viewports) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      storageState: STATE_FILE,
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile || false
    });

    const page = await context.newPage();

    const allowedPosts = [];
    const blockedRequests = [];
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    await page.route('**/api/**', (route, request) => {
      const method = request.method();
      const url = request.url();
      if (method !== 'GET') {
        if (url.includes('/api/search/search.php')) {
          allowedPosts.push({ method, url });
          route.continue();
        } else {
          console.warn(`[SAFETY ABORT] ${method} ${url}`);
          blockedRequests.push({ method, url, postData: request.postData() });
          route.abort('blockedbyclient');
        }
      } else {
        route.continue();
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({ url: page.url(), text: msg.text() });
      }
    });
    page.on('pageerror', err => {
      pageErrors.push({ url: page.url(), message: err.message });
    });
    page.on('response', resp => {
      if (resp.status() >= 400) {
        failedRequests.push({ url: resp.url(), status: resp.status() });
      }
    });

    // 1. Initial login verification / Home
    console.log(`[${vp.name}] Visiting /#/mypage/home...`);
    await page.goto(`${BASE_URL}/#/mypage/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const homeShot = `c3-00-mypage-home-${vp.name}.png`;
    await page.screenshot({ path: path.join(SHOTS_DIR, homeShot), fullPage: true });

    // 2. Menu Navigation to Community: 클릭으로 커뮤니티 허브 진입
    console.log(`[${vp.name}] Navigating to Community via Menu click...`);
    const menuClicked = await page.evaluate(() => {
      // Find nav link containing '커뮤니티'
      const links = Array.from(document.querySelectorAll('a, button, [role="button"]'));
      const target = links.find(el => el.textContent && el.textContent.trim() === '커뮤니티');
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    await page.waitForTimeout(3000);
    const commHubMenuShot = `c3-01-community-hub-via-menu-${vp.name}.png`;
    await page.screenshot({ path: path.join(SHOTS_DIR, commHubMenuShot), fullPage: true });

    const commHubMenuState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hash: window.location.hash,
        title: document.title,
        bodyText: document.body.innerText.slice(0, 400),
        navItems: Array.from(document.querySelectorAll('.community-nav a, nav a, .sub-nav a')).map(a => ({
          text: a.textContent.trim(),
          href: a.getAttribute('href'),
          active: a.classList.contains('active') || a.getAttribute('aria-current') === 'page'
        }))
      };
    });

    results.push({
      test: 'Community Hub via Menu',
      viewport: vp.name,
      menuClicked,
      state: commHubMenuState,
      screenshot: commHubMenuShot
    });

    // 3. Direct URL access to Community boards vs Menu
    const communityTargets = [
      { id: 'hub', path: '/#/community', label: '커뮤니티 허브' },
      { id: 'tutor', path: '/#/community/tutor', label: '과외쌤 고민방' },
      { id: 'director', path: '/#/community/director', label: '공부방 고민방' },
      { id: 'parent', path: '/#/community/parent', label: '학생/학부모 고민방' },
      { id: 'solved', path: '/#/community/solved', label: '해결후기' }
    ];

    for (const tgt of communityTargets) {
      console.log(`[${vp.name}] Direct navigation to ${tgt.path}...`);
      await page.goto(`${BASE_URL}${tgt.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const shotName = `c3-direct-${tgt.id}-${vp.name}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, shotName), fullPage: true });

      const pageState = await page.evaluate(() => {
        const postItems = Array.from(document.querySelectorAll('.concern-card, .post-item, .community-card, [data-post-id], article, .concern-list-item')).map(el => ({
          title: el.querySelector('h2, h3, h4, .title, .concern-card__title')?.textContent?.trim() || el.textContent?.slice(0, 50)?.trim(),
          hasAuthor: !!el.querySelector('.author, .meta, .user'),
          hasBodySnippet: !!el.querySelector('.desc, .snippet, .body, p')
        }));
        const composeBtn = Array.from(document.querySelectorAll('a, button')).find(el => {
          const t = el.textContent || '';
          return t.includes('글쓰기') || t.includes('고민 쓰기') || t.includes('후기 쓰기') || t.includes('질문하기');
        });
        const loginBtn = Array.from(document.querySelectorAll('a, button')).find(el => {
          const t = el.textContent || '';
          return t.includes('로그인') && !t.includes('로그아웃');
        });
        const guestBanner = Array.from(document.querySelectorAll('.guest-banner, .login-prompt, .auth-guard, .intro-banner')).map(b => b.textContent?.trim());

        return {
          url: window.location.href,
          hash: window.location.hash,
          title: document.title,
          postCount: postItems.length,
          samplePosts: postItems.slice(0, 3),
          composeBtn: composeBtn ? { text: composeBtn.textContent.trim(), href: composeBtn.getAttribute('href') } : null,
          hasLoginBtn: !!loginBtn,
          guestBanner,
          bodySnippet: document.body.innerText.slice(0, 400)
        };
      });

      results.push({
        test: `Direct ${tgt.label}`,
        target: tgt,
        viewport: vp.name,
        state: pageState,
        screenshot: shotName
      });
    }

    // 4. 과외쌤 고민방 상세 & 글쓰기 폼 점검 (PC에서 집중 테스트)
    if (vp.name === 'pc') {
      console.log(`[${vp.name}] Checking tutor concern detail & compose...`);
      await page.goto(`${BASE_URL}/#/community/tutor`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);

      // Check if there is a post to click
      const postClickable = await page.evaluate(() => {
        const post = document.querySelector('.concern-card, .community-card, .post-item, [data-post-id] a, a[href*="/community/tutor/"]');
        if (post) {
          const link = post.tagName === 'A' ? post : post.querySelector('a');
          if (link) return { href: link.getAttribute('href'), text: link.textContent.trim() };
          return { text: post.textContent.trim(), isElement: true };
        }
        return null;
      });

      if (postClickable) {
        console.log(`[${vp.name}] Found post:`, postClickable);
        if (postClickable.href) {
          await page.goto(`${BASE_URL}${postClickable.href.startsWith('#') ? postClickable.href : '#' + postClickable.href}`, { waitUntil: 'networkidle' });
        } else {
          await page.click('.concern-card, .community-card, .post-item, [data-post-id]');
        }
        await page.waitForTimeout(3000);
        const detailShot = `c3-tutor-detail-${vp.name}.png`;
        await page.screenshot({ path: path.join(SHOTS_DIR, detailShot), fullPage: true });

        const detailState = await page.evaluate(() => {
          const commentForm = document.querySelector('form.comment-form, .comment-box, textarea[placeholder*="댓글"], textarea');
          const commentBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('댓글'));
          return {
            url: window.location.href,
            hash: window.location.hash,
            title: document.title,
            hasCommentBox: !!commentForm,
            commentBoxPlaceholder: commentForm?.getAttribute('placeholder') || null,
            hasCommentSubmitBtn: !!commentBtn,
            bodySnippet: document.body.innerText.slice(0, 500)
          };
        });

        results.push({
          test: 'Tutor Concern Detail',
          viewport: vp.name,
          state: detailState,
          screenshot: detailShot
        });
      }

      // Check Compose Screen: /#/community/tutor/new
      console.log(`[${vp.name}] Visiting /#/community/tutor/new...`);
      await page.goto(`${BASE_URL}/#/community/tutor/new`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const composeShot = `c3-tutor-compose-new-${vp.name}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, composeShot), fullPage: true });

      const composeState = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute('type') || null,
          name: el.getAttribute('name') || null,
          id: el.getAttribute('id') || null,
          placeholder: el.getAttribute('placeholder') || null,
          required: el.hasAttribute('required')
        }));
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
          text: b.textContent?.trim() || b.getAttribute('value'),
          type: b.getAttribute('type')
        }));
        return {
          url: window.location.href,
          hash: window.location.hash,
          title: document.title,
          inputs,
          buttons,
          bodySnippet: document.body.innerText.slice(0, 400)
        };
      });

      // Type some characters without submitting
      try {
        const titleInput = await page.$('input[name="title"], input[placeholder*="제목"], input[type="text"]');
        if (titleInput) {
          await titleInput.fill('[테스트미제출] 과외쌤 고민 문의 테스트 입력');
        }
        const contentInput = await page.$('textarea[name="content"], textarea[placeholder*="내용"], textarea');
        if (contentInput) {
          await contentInput.fill('[테스트미제출] 본문 입력 필드 무결성 점검 중입니다. 제출 버튼은 누르지 않습니다.');
        }
        await page.waitForTimeout(1000);
        const composeTypedShot = `c3-tutor-compose-typed-${vp.name}.png`;
        await page.screenshot({ path: path.join(SHOTS_DIR, composeTypedShot), fullPage: true });
      } catch (e) {
        console.warn('Could not fill compose inputs:', e.message);
      }

      results.push({
        test: 'Tutor Concern Compose Screen',
        viewport: vp.name,
        state: composeState,
        screenshot: composeShot
      });

      // 5. Check Compose on Forbidden Boards for Tutor:
      // 공부방 고민방 글쓰기: /#/community/director/new
      console.log(`[${vp.name}] Visiting forbidden compose /#/community/director/new...`);
      await page.goto(`${BASE_URL}/#/community/director/new`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      const directorComposeShot = `c3-forbidden-director-compose-${vp.name}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, directorComposeShot), fullPage: true });
      const directorComposeState = await page.evaluate(() => ({
        url: window.location.href,
        hash: window.location.hash,
        bodySnippet: document.body.innerText.slice(0, 400),
        hasForm: !!document.querySelector('form, input, textarea')
      }));

      results.push({
        test: 'Forbidden Director Compose Screen',
        viewport: vp.name,
        state: directorComposeState,
        screenshot: directorComposeShot
      });

      // 학부모 고민방 글쓰기: /#/community/parent/new
      console.log(`[${vp.name}] Visiting forbidden compose /#/community/parent/new...`);
      await page.goto(`${BASE_URL}/#/community/parent/new`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      const parentComposeShot = `c3-forbidden-parent-compose-${vp.name}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, parentComposeShot), fullPage: true });
      const parentComposeState = await page.evaluate(() => ({
        url: window.location.href,
        hash: window.location.hash,
        bodySnippet: document.body.innerText.slice(0, 400),
        hasForm: !!document.querySelector('form, input, textarea')
      }));

      results.push({
        test: 'Forbidden Parent Compose Screen',
        viewport: vp.name,
        state: parentComposeState,
        screenshot: parentComposeShot
      });

      // 해결후기 글쓰기: /#/community/solved/new
      console.log(`[${vp.name}] Visiting solved compose /#/community/solved/new...`);
      await page.goto(`${BASE_URL}/#/community/solved/new`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      const solvedComposeShot = `c3-solved-compose-${vp.name}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, solvedComposeShot), fullPage: true });
      const solvedComposeState = await page.evaluate(() => ({
        url: window.location.href,
        hash: window.location.hash,
        bodySnippet: document.body.innerText.slice(0, 400),
        hasForm: !!document.querySelector('form, input, textarea')
      }));

      results.push({
        test: 'Solved Compose Screen',
        viewport: vp.name,
        state: solvedComposeState,
        screenshot: solvedComposeShot
      });
    }

    // 6. Information Boards & Library & Submission
    const infoBoards = [
      { id: 'library', path: '/#/library', label: '자료실 허브' },
      { id: 'library-templates', path: '/#/library/templates', label: '양식·체크리스트' },
      { id: 'library-guides', path: '/#/library/guides', label: '가이드 PDF' },
      { id: 'info-room', path: '/#/library/room-info', label: '공부방 쏙쏙정보' },
      { id: 'info-tutor', path: '/#/library/tutor-tips', label: '과외쌤 따끈 팁가이드' },
      { id: 'info-student', path: '/#/library/student-tips', label: '학생 꿀팁 가이드' },
      { id: 'submission', path: '/#/submission', label: '신뢰·증빙자료 제출' }
    ];

    for (const ib of infoBoards) {
      console.log(`[${vp.name}] Visiting Info Board: ${ib.path}...`);
      await page.goto(`${BASE_URL}${ib.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      const ibShot = `c3-ib-${ib.id}-${vp.name}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, ibShot), fullPage: true });

      const ibState = await page.evaluate(() => {
        const composeBtn = Array.from(document.querySelectorAll('a, button')).find(el => {
          const t = el.textContent || '';
          return t.includes('글쓰기') || t.includes('작성') || t.includes('등록');
        });
        const items = Array.from(document.querySelectorAll('.post-item, .library-card, .info-card, article, tr, [data-key]'));
        return {
          url: window.location.href,
          hash: window.location.hash,
          title: document.title,
          itemCount: items.length,
          hasComposeBtn: !!composeBtn,
          composeBtnText: composeBtn?.textContent?.trim() || null,
          bodySnippet: document.body.innerText.slice(0, 300)
        };
      });

      results.push({
        test: `Info Board ${ib.label}`,
        viewport: vp.name,
        target: ib,
        state: ibState,
        screenshot: ibShot
      });
    }

    results.push({
      summary: `Viewport ${vp.name} network & errors`,
      viewport: vp.name,
      allowedPosts,
      blockedRequests,
      consoleErrors,
      pageErrors,
      failedRequests
    });

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(OUT_DIR, 'results_community.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log('\n=== Community test finished. Saved to results_community.json ===\n');
}

run().catch(err => {
  console.error('Fatal error during community test:', err);
  process.exit(1);
});
