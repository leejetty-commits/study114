/**
 * PR-B — 로그인 브라우저 기능 경로 (Chromium · workers=1)
 * home-ui :5174 + API :8080 프록시 필요.
 * page.request로 세션 쿠키를 브라우저 컨텍스트에 심고, 라우트·버튼 상태를 확인한다.
 */
import { test, expect } from '@playwright/test';
import { logout, restoreMemoGateE2e, ACCOUNTS, DEV_PASSWORD, devSql } from './helpers/admin-api.js';

test.describe.configure({ mode: 'serial' });

function zeroActivePaidPacks() {
  try {
    devSql(
      "UPDATE provider_ticket_packs SET remaining=0 WHERE user_id=4 AND ticket_type='memo' AND source='payment' AND provider_type='tutor' AND provider_id=1",
    );
  } catch {
    /* provider columns may be absent on older DBs */
  }
}

/** @param {import('@playwright/test').Page} page */
async function loginTutorInBrowser(page) {
  const res = await page.request.post('/api/auth/login.php', {
    data: { email: ACCOUNTS.tutor, password: DEV_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBeTruthy();
}

test.describe('PR-B browser plans/access', () => {
  test('1-8 공급자 로그인·access·5회 구매·내상품·비활성·즉시권·쪽지함', async ({ page }) => {
    restoreMemoGateE2e();
    zeroActivePaidPacks();
    await loginTutorInBrowser(page);

    await page.goto('/#/plans/access?provider_type=tutor&provider_id=1');
    await expect(page.locator('text=쪽지권').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('a[data-plans-nav="/plans/my"]')).toContainText(/내 쪽지권|내 상품/);
    await expect(page.locator('a[data-nav="/mypage/messages"]')).toContainText('쪽지함');

    const createRes = await page.request.post('/api/paid/checkout.php', {
      data: {
        action: 'create',
        product_id: 'memo_ticket',
        variant: '5회권',
        provider_type: 'tutor',
        provider_id: 1,
      },
    });
    if (createRes.status() === 409) {
      zeroActivePaidPacks();
      const retry = await page.request.post('/api/paid/checkout.php', {
        data: {
          action: 'create',
          product_id: 'memo_ticket',
          variant: '5회권',
          provider_type: 'tutor',
          provider_id: 1,
        },
      });
      expect(retry.ok()).toBeTruthy();
      const body = await retry.json();
      const done = await page.request.post('/api/paid/checkout.php', {
        data: { action: 'complete', order_ref: body.order_ref },
      });
      expect(done.ok()).toBeTruthy();
      const doneBody = await done.json();
      expect(doneBody.status).toBe('paid');
      expect(doneBody.fulfilled).toBeTruthy();
    } else {
      expect(createRes.ok()).toBeTruthy();
      const body = await createRes.json();
      const done = await page.request.post('/api/paid/checkout.php', {
        data: { action: 'complete', order_ref: body.order_ref },
      });
      expect(done.ok()).toBeTruthy();
      const doneBody = await done.json();
      expect(doneBody.status).toBe('paid');
      expect(doneBody.fulfilled).toBeTruthy();
    }

    // 재진입: hash를 바꿔 캐시된 access status를 다시 hydrate
    await page.goto('/#/plans');
    await page.goto('/#/plans/access?provider_type=tutor&provider_id=1');
    await expect(page.locator('[data-plans-access-status="active-pack"]')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('text=이미 사용 중인 유료 묶음권')).toBeVisible();

    const options = page.locator('select[data-plans-option="memo_ticket"] option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const label = (await options.nth(i).innerText()).trim();
      const disabled = await options.nth(i).evaluate((el) => el.disabled);
      if (/^5회|^10회/.test(label)) {
        expect(disabled, label).toBe(true);
      }
      if (/^1회/.test(label)) {
        expect(disabled, label).toBe(false);
      }
    }

    await page.reload();
    await page.goto('/#/plans/access?provider_type=tutor&provider_id=1');
    await expect(page.locator('[data-plans-access-status="active-pack"]')).toBeVisible({
      timeout: 20_000,
    });
    const optionsAfterReload = page.locator('select[data-plans-option="memo_ticket"] option');
    for (let i = 0; i < (await optionsAfterReload.count()); i++) {
      const label = (await optionsAfterReload.nth(i).innerText()).trim();
      const disabled = await optionsAfterReload.nth(i).evaluate((el) => el.disabled);
      if (/^5회|^10회/.test(label)) {
        expect(disabled, label).toBe(true);
      }
      if (/^1회/.test(label)) {
        expect(disabled, label).toBe(false);
      }
    }

    await page.locator('a[data-plans-nav="/plans/my"]').first().click();
    await expect(page).toHaveURL(/mypage\/plans\/my/);
    await expect(page.locator('[data-plans-my-status="packs-ready"]')).toBeVisible({
      timeout: 20_000,
    });
    const paidActiveRow = page.locator(
      '[data-plans-pack-row][data-plans-pack-grant="유료 구매"][data-plans-pack-status="사용 중"][data-plans-pack-granted="5"][data-plans-pack-remaining="5"]',
    );
    await expect(paidActiveRow.first()).toBeVisible();
    await expect(paidActiveRow.first().locator('[data-plans-pack-expires]')).not.toHaveText('');
    await expect(paidActiveRow.first().locator('td').nth(1)).toContainText('5회');

    await page.goto('/#/mypage/plans');
    await page.goto('/#/mypage/plans/my?provider_type=tutor&provider_id=99999');
    await expect(page.locator('text=쪽지권').first()).toBeVisible();
    await expect(page.locator('[data-plans-pack-row][data-plans-pack-provider="1"]')).toHaveCount(0);

    await page.goto('/#/plans/access?provider_type=tutor&provider_id=1');
    await page.locator('a[data-nav="/mypage/messages"]').first().click();
    await expect(page).toHaveURL(/mypage\/messages/);

    const status = await page.request.get('/api/paid/status.php?provider_type=tutor&provider_id=1');
    expect(status.ok()).toBeTruthy();
    const history = await page.request.get('/api/paid/history.php');
    expect(history.ok()).toBeTruthy();

    await logout(page.request);
  });

  test('9-13 쪽지 OFF 차단·즉시권 발송 1건·멱등·request_view 미차감', async ({ page }) => {
    restoreMemoGateE2e();
    try {
      devSql(
        "INSERT INTO students (id, guardian_user_id, student_name, exposure_status, memo_status) VALUES (9052, 6, 'e2e-memo-paused', 'published', 'paused'), (9053, 6, 'e2e-immediate-open', 'published', 'open') ON DUPLICATE KEY UPDATE exposure_status=VALUES(exposure_status), memo_status=VALUES(memo_status)",
      );
      devSql(
        "DELETE m FROM messages m INNER JOIN message_threads t ON t.id=m.thread_id WHERE t.context_kind='student' AND t.context_id=9053",
      );
      devSql("DELETE FROM message_threads WHERE context_kind='student' AND context_id=9053");
    } catch {
      /* ignore if tables differ */
    }
    await loginTutorInBrowser(page);

    const blocked = await page.request.post('/api/paid/checkout.php', {
      data: {
        action: 'create',
        product_id: 'memo_ticket',
        variant: '1회',
        provider_type: 'tutor',
        provider_id: 1,
        student_id: 9052,
        body: '쪽지 OFF 차단 확인',
      },
    });
    expect(blocked.ok()).toBeFalsy();
    const blockedBody = await blocked.json().catch(() => ({}));
    expect(JSON.stringify(blockedBody)).toMatch(/쪽지|memo|받지|paused|수신/i);

    const createImm = await page.request.post('/api/paid/checkout.php', {
      data: {
        action: 'create',
        product_id: 'memo_ticket',
        variant: '1회',
        provider_type: 'tutor',
        provider_id: 1,
        student_id: 9053,
        body: `PR-B e2e immediate ${Date.now()}`,
      },
    });
    expect(createImm.ok()).toBeTruthy();
    const imm = await createImm.json();
    const orderRef = imm.order_ref;
    expect(orderRef).toBeTruthy();

    const first = await page.request.post('/api/paid/checkout.php', {
      data: { action: 'complete', order_ref: orderRef },
    });
    expect(first.ok()).toBeTruthy();
    const firstBody = await first.json();
    expect(firstBody.status).toBe('paid');
    expect(firstBody.fulfilled).toBeTruthy();

    const second = await page.request.post('/api/paid/checkout.php', {
      data: { action: 'complete', order_ref: orderRef },
    });
    expect(second.ok()).toBeTruthy();
    const secondBody = await second.json();
    expect(secondBody.status).toBe('paid');
    expect(secondBody.fulfilled).toBeTruthy();

    await page.goto('/#/mypage/messages');
    await expect(page).toHaveURL(/mypage\/messages|messages/);
    await expect(page.getByText(/쪽지|대화|메시지/).first()).toBeVisible({ timeout: 20_000 });

    const unlock = await page.request.post('/api/paid/request-access.php', {
      data: { student_id: 9053 },
    });
    if (unlock.ok()) {
      const unlockBody = await unlock.json();
      expect(unlockBody.consumed ?? false).toBeFalsy();
    }

    await logout(page.request);
  });

  test('미리보기 로그인 세션으로 access 진입', async ({ page }) => {
    await loginTutorInBrowser(page);
    await page.goto('/#/plans/access?provider_type=tutor&provider_id=1');
    await expect(page.locator('.plans-store, .mypage-panel').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('쪽지권').first()).toBeVisible();
  });
});
