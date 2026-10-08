# 147 Guide Student FAQ — REJECT

- **Verdict:** REJECT
- **Date:** 2026-09-28 (KST)
- **Inspector:** actual PC files (ljh_work), not Cursor report
- **Render SoT:** `preview/home-ui/src/guide/screens.js` via `index.js` → `renderGuideScreen` (screens does **not** import copy FAQ)
- **HEAD / blobs:** match claim (`f154183…`, copy `92716d32…`, screens `7f3b8a4c…`); allowlist OK; no push

## Fail (Must)

1. `#/guide/start` 「학생찾기」본문이 §1.5 의미 미달 (반대 방향·우리동네 미리보기 없음)
2. `#/guide/register` 「학생 등록」본문이 §1.6과 불일치 (공개/숨김 창작, 기본노출·상세보완·저장 문장 누락)
3. 5페이지 FAQ가 screens SoT에서 토큰형 1줄 checklist — memo §4 intent 미달; compare에 FAQ 섹션 없음

## Pass (partial)

Hub aux 설명·3카드, 절 제목 존재, safe 학생 1문장, 신뢰정보(146), max3+내린뒤(본문), 찜→비교→쪽지, 학생 비대상, 학생의뢰 0, allowlist

See parent final report for evidence table + Cursor rework paste.
