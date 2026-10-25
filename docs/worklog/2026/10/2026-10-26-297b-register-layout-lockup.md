# 297b — 공부방·과외쌤 등록 본문 pencil 로고 → brand-lockup

- **지시원문**: 채팅 요청 (2026-10-26)
- **브랜치**: `cursor/297b-register-layout-lockup-20261026`
- **base**: `d34dc7ee700ed40d987951ddf2b74353c5e55f69` (origin/main)

---

## 변경 파일

| 파일 | 변경 |
|---|---|
| `preview/study-room-ui/src/layout.js` | `img.brand-hero__logo` pencil-lockup → `span.brand-lockup.brand-lockup--hero` (심벌+워드마크) |
| `preview/tutor-ui/src/layout.js` | 동일 교체 |

## rg logo-lockup-pencil-wordmark 결과

- `preview/home-ui/src/home-popup/content.js` — 홈팝업 LOCKUP (지시에 따라 미수정)
- 그 외 제품 UI: **0건** ✅

## AC
- [x] base SHA = `d34dc7ee700ed40d987951ddf2b74353c5e55f69`
- [x] git diff --stat origin/main → 허용 파일만 (JS 2 + worklog)
- [x] rg pencil-lockup → 제품 UI hit 0 (home-popup만 허용 잔류)
- [x] study-room / tutor layout에 pencil img 0 · brand-lockup 심벌+워드마크 각 1
- [x] node --check 통과
- [x] push + PR 생성 (merge 금지)
