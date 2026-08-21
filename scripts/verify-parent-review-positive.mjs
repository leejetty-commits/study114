/**
 * 자격 충족 학부모/학생 — 확대카드 후기수 → 시트/섹션 CTA → 작성폼 → 저장 성공
 * 실행: cd preview/home-ui && npx --yes vite-node ../../scripts/verify-parent-review-positive.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

if (typeof globalThis.sessionStorage === 'undefined') {
  const mem = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
  };
}
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = globalThis.sessionStorage;
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}
globalThis.window.location = globalThis.window.location || {
  hash: '#/parent',
  href: 'http://localhost/#/parent',
  origin: 'http://localhost',
  pathname: '/',
  search: '',
};
globalThis.window.location.hash = '#/parent';
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { body: {}, querySelector: () => null, querySelectorAll: () => [] };
}

sessionStorage.setItem('study114-preview-active-role', 'parent');
sessionStorage.setItem('study114-preview-provider-reviews-v2', JSON.stringify([]));
sessionStorage.setItem('study114-preview-review-quotas-v1', JSON.stringify({}));
sessionStorage.setItem('study114-preview-review-blocks-v1', JSON.stringify([]));
sessionStorage.setItem('study114-preview-review-write-status-v1', JSON.stringify({}));
sessionStorage.setItem(
  'study114-preview-message-threads-v2',
  JSON.stringify({
    threads: [
      {
        id: 9001,
        contextKind: 'study_room',
        contextId: 77,
        contextLabel: '공부방',
        peerDisplayName: '자격충족 경로 검증',
        initiatedByMe: true,
        messages: [{ id: 1, sender: 'me', body: '상담 문의', createdAt: '2026-08-22 00:00:00' }],
      },
    ],
  }),
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../tmp/parent-review-positive');
fs.mkdirSync(outDir, { recursive: true });

const { renderItemActions } = await import('../preview/home-ui/src/exposure-render.js');
const { EXPOSURE_STUDY_ROOMS } = await import('../preview/home-ui/src/exposure-data.js');
const { renderSecondaryActions } = await import('../preview/home-ui/src/detail-decision/detail-shell.js');
const { getReviewSummaryLocal, createProviderReview } = await import(
  '../preview/home-ui/src/provider-reviews/store.js'
);
const { canOfferWriteCta, PROVIDER_REVIEW_COPY, STUDY_ROOM_POINT_TAGS } = await import(
  '../preview/home-ui/src/provider-reviews/copy.js'
);
const { renderCta, renderForm, resolveRequestedView } = await import(
  '../preview/home-ui/src/provider-reviews/sheet.js'
);
const { renderReviewSectionMarkup } = await import('../preview/home-ui/src/provider-reviews/ui.js');

const PARENT = { role: 'parent', userId: 6, isOwner: false };
const TARGET_ID = 77;
const item = { ...EXPOSURE_STUDY_ROOMS[0], id: TARGET_ID, review_count: 2, recommend_count: 1 };
const rows = [];
let pass = 0;
let fail = 0;

function record(ok, id, detail) {
  if (ok) pass += 1;
  else fail += 1;
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id} — ${detail}`;
  rows.push({ ok, id, detail });
  console.log(line);
}

const railHtml = renderItemActions({
  guest: false,
  compareKind: 'study_room',
  showCompare: true,
  showWish: true,
  itemId: TARGET_ID,
  item,
  review_count: 2,
  recommend_count: 1,
});
record(
  /data-action="open-review-sheet"/.test(railHtml) && /data-item-kind="study_room"/.test(railHtml),
  'P1_expand_rail_review_count',
  '확대카드와 동일 레일 후기수 버튼(open-review-sheet) 존재',
);

const footerHtml = renderSecondaryActions('study_room', item, 'parent');
record(
  /data-p24-action="review-write"/.test(footerHtml) && footerHtml.includes('후기 남기기'),
  'P2_expand_footer_write_cta',
  '학부모 확대카드 푸터 「후기 남기기」 노출',
);
record(
  !/data-p24-action="review-write"/.test(renderSecondaryActions('study_room', item, 'study_room')),
  'P2b_provider_footer_no_write',
  '공급자 확대카드 푸터에는 작성 CTA 없음(대조)',
);

const summary = getReviewSummaryLocal('study_room', TARGET_ID, PARENT);
record(
  summary.can_write === true &&
    summary.write_blocked_reason == null &&
    summary.cta_kind === 'write',
  'P3_eligible_can_write',
  `can_write=${summary.can_write} reason=${summary.write_blocked_reason} cta_kind=${summary.cta_kind}`,
);
record(canOfferWriteCta(summary) === true, 'P4_canOfferWriteCta', String(canOfferWriteCta(summary)));
record(
  resolveRequestedView(summary, 'write') === 'write',
  'P5_sheet_opens_form_not_gate',
  `resolveRequestedView(write)=${resolveRequestedView(summary, 'write')}`,
);

const sheetCta = renderCta(summary);
record(
  /data-review-sheet-act="write"/.test(sheetCta) && sheetCta.includes(PROVIDER_REVIEW_COPY.writeCta),
  'P6_sheet_write_cta',
  sheetCta.replace(/\s+/g, ' ').trim().slice(0, 180),
);

const sectionHtml = renderReviewSectionMarkup(summary);
record(
  /data-provider-review-cta="write"/.test(sectionHtml) && sectionHtml.includes('후기 남기기'),
  'P7_section_write_cta',
  '확대카드 후기 섹션에 후기 남기기 CTA',
);

const formHtml = renderForm(summary);
record(
  /data-review-form/.test(formHtml) &&
    /name="body"/.test(formHtml) &&
    /name="public_consent"/.test(formHtml) &&
    formHtml.includes(PROVIDER_REVIEW_COPY.submit),
  'P8_write_form_open',
  '작성폼: 본문·태그·공개동의·후기 등록',
);

const beforeCount = Number(summary.review_count) || 0;
const body =
  '상담 후 실제 분위기와 안내가 잘 맞았습니다. 자격충족 학부모 작성 경로 검증입니다.';
const saved = await createProviderReview(
  {
    provider_type: 'study_room',
    provider_id: TARGET_ID,
    review_origin_type: 'consultation',
    review_body: body,
    point_tags: STUDY_ROOM_POINT_TAGS.slice(0, 2),
    public_consent: true,
  },
  { userId: 6 },
);
const created = (saved.reviews || []).find((r) => r.review_body === body && r.is_mine);
record(
  Number(saved.review_count) === beforeCount + 1 && !!created && saved.cta_kind === 'manage',
  'P9_save_success',
  `review_count ${beforeCount}→${saved.review_count} created_id=${created?.id ?? 'none'} cta_kind=${saved.cta_kind}`,
);

const after = getReviewSummaryLocal('study_room', TARGET_ID, PARENT);
record(
  after.has_written === true && after.can_write === true && after.remaining_creates === 2,
  'P10_quota_after_save',
  `has_written=${after.has_written} remaining=${after.remaining_creates} can_write=${after.can_write}`,
);

fs.writeFileSync(
  path.join(outDir, '01-expand-rail-review-count.html'),
  `<!doctype html><meta charset="utf-8"><title>확대 레일 후기수</title>${railHtml}`,
);
fs.writeFileSync(
  path.join(outDir, '02-expand-footer-write-cta.html'),
  `<!doctype html><meta charset="utf-8"><title>확대 푸터 후기 남기기</title>${footerHtml}`,
);
fs.writeFileSync(
  path.join(outDir, '03-sheet-consume-cta.html'),
  `<!doctype html><meta charset="utf-8"><title>후기 시트 CTA</title><div class="review-sheet__cta">${sheetCta}</div>`,
);
fs.writeFileSync(
  path.join(outDir, '04-section-write-cta.html'),
  `<!doctype html><meta charset="utf-8"><title>후기 섹션 CTA</title>${sectionHtml}`,
);
fs.writeFileSync(
  path.join(outDir, '05-write-form.html'),
  `<!doctype html><meta charset="utf-8"><title>작성폼</title>${formHtml}`,
);
fs.writeFileSync(
  path.join(outDir, 'evidence.json'),
  JSON.stringify(
    {
      viewer: PARENT,
      thread_seed: { contextKind: 'study_room', contextId: TARGET_ID },
      before: {
        can_write: summary.can_write,
        write_blocked_reason: summary.write_blocked_reason,
        cta_kind: summary.cta_kind,
        review_count: beforeCount,
      },
      after_save: {
        review_count: saved.review_count,
        created_id: created?.id ?? null,
        cta_kind: saved.cta_kind,
        remaining_creates: after.remaining_creates,
        body_preview: body.slice(0, 40),
      },
      results: rows,
      pass,
      fail,
    },
    null,
    2,
  ),
);

console.log(`\n${pass} PASS / ${fail} FAIL`);
console.log(`artifacts: ${outDir}`);
if (fail) process.exit(1);
