# 352 — 플로팅 「맨 아래로」(모바일만)

**브랜치:** `work/352-scroll-to-bottom`  
**기준:** `origin/main` (`ea2d5a1a` · #167 머지 후)  
**일시:** 2026-11-11  
**작업 폴더:** `D:\work\study114\.wt\work-352-scroll-to-bottom`

## 선행

| 항목 | 결과 |
|------|------|
| #167(351) 머지 | `ea2d5a1a` |
| Deploy | [43020618667](https://github.com/leejetty-commits/study114/actions/runs/43020618667) **success** |
| #168(358) | push·PR 열림 (머지 대기) |

## 구현

| 파일 | 내용 |
|------|------|
| `preview/shared/back-to-top.js` | `study114-back-to-bottom` · 모바일≤768 · 하단 96px 숨김 · reduced-motion · 모달 목록 확장 |
| `preview/home-ui/src/styles/design-system.css` | `.back-to-bottom` 데스크톱 `display:none` · 모바일 스택(맨위 위 8px) · focus-visible |
| `scripts/verify-back-to-bottom.mjs` | 정적 검사 |

### 모달 선택자 (`MODAL_OPEN_SELECTORS` + body class)

`#p24-detail-modal`, `#compare-modal-root`, `.review-sheet-root`, `#ng-login-gate`, `#ng-card-unavailable`, `.msg-overlay`, `.s114-confirm-backdrop`, `.shop-lightbox:not([hidden])`, `.modal-overlay.member-delete-modal`, `body.p24-detail-open`

### z-index

버튼 1200 유지. 모달·시트 1400~1600대 → 버튼이 모달 아래.

### 하단 겹침

모바일 하단 고정 탭/쿠키 배너 현행 없음 → `bottom` 기존 1.25rem 스택 유지.

---

## 테스트

```
node scripts/verify-back-to-bottom.mjs → 16 PASS / 0 FAIL
```

로컬 5174 스크린샷: 미기동 → 정적·CSS 미디어쿼리로 1920 미표시·맨위 위치 불변 확인.

---

## 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|---|---|---|
| 1 | 390·360 맨위 위에 맨아래 | PASS* | CSS calc 스택 (*실기기 샷 미촬영) |
| 2 | 맨 아래 근처 숨김 | PASS | distanceFromBottom ≤ 96 |
| 3 | 짧은 페이지 둘 다 숨김 | PASS | pageOverflows() |
| 4 | 모달 열림 둘 다 숨김 | PASS | MODAL_OPEN_SELECTORS |
| 5 | reduced motion 즉시 | PASS | behavior auto |
| 6 | 1920 맨아래 미표시·0px | PASS | display:none >768 · 맨위 bottom 1.25rem 유지 |
| 7 | 하단 고정과 겹침 없음 | PASS | 현행 하단탭 없음 |
| 8 | 44px·포커스·aria | PASS | 2.75rem · focus-visible · aria-label |
| 9 | verify PASS | PASS | 16/0 |
| 10 | 공통 금지 위반 없음 | PASS | |

---

```
[최종검수 패키지 — 352]
브랜치 / 커밋: work/352-scroll-to-bottom / (커밋 후 기입)
변경 파일: (커밋 후)
diff 요약: back-to-top.js 맨아래 추가(모바일) · CSS 스택 · verify
테스트: verify-back-to-bottom 16 PASS
스크린샷: 로컬 UI 미기동 → 생략(정적 PASS)
API 확인: 해당 없음
셀프검수 체크리스트: 1~10 PASS (*1 실샷 제한)
미해결·종현 결정 필요: 데스크톱에도 맨아래 넣을지(권장: 모바일만 유지)
```
