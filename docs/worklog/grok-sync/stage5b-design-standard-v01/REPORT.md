# Stage 5B Design Standard v01 — REPORT

작성: 2026-09-08 KST (Asia/Seoul)  
상태: **5B 초안 보드 1차 납품 · 최종 승인 아님**  
범위: `/workspace/study114-ds/stage5b-design-standard-v01/` 만 작성. ops / GitHub / DB / API / routes / stage5a 팩 / plans-ui-v5 소스 **미수정** (폰트·토큰 읽기/복사만).

---

## 1. What was built (paths)

| 경로 | 설명 |
|------|------|
| `index.html` | 허브 + 디스클레이머 |
| `01-foundation.html` | 색 스와치+실물 컨트롤, 타이포 12–36, 간격 바, 반지름·보더·sticky |
| `02-badge-radius.html` | 뱃지 4px · Role Tab/Filter 6px · C 텍스트 pill 폐기 |
| `09-shape-compare.html` | BEFORE(before-shape) vs AFTER 라이브 비교 |
| `03-vertical-rhythm.html` | Dense / Standard(권장) / Spacious |
| `04-role-modes.html` | 공부방·과외쌤·학생·학부모 동일 레이아웃 |
| `05-cards.html` | Prime / Pick / Basic 케이스 보드 |
| `06-banners.html` | Info/Success/Warning/Error/Role×3/Paid |
| `07-paid-context.html` | 쿨 블루 vs 아이보리 구매 맥락 |
| `08-responsive-shell.html` | 검색 셸 1440/768/390 |
| `tokens.css` | `.uds-theme` + 역할·뱃지·paid 확장 |
| `board.css` | 공통 컴포넌트 (raw HEX 없음) |
| `fonts/*.woff2` | Pretendard 6종 (5A에서 복사) |
| `capture.py` | Chrome headless + Pillow autocrop |
| `TOKENS.md` | 사용 토큰 목록 |
| `EXCEPTIONS.md` | 미해결·5A 대비 예외 |
| `shots/*.png` | 캡처 11장 |
| `/workspace/study114-ds/stage5b-design-standard-v01.zip` | 팩 ZIP |

---

## 2. Token list summary

- **5A 연속:** Primary `#266BC4`, Ink `#1C1917`, Muted `#4B5563`, Bg `#F7F8FA`, Surface `#FFF`, Line `#E5E7EB`, success/warning/error/disabled, fs 12–36, spacing `--s-0-5`…`--s-8`, `--r-card` 12, `--r-ctl` 8, `--shadow-sticky` only.
- **역할 15%:** `--role-room/tutor/student` + soft/line. CTA 채움에 쓰지 않음.
- **Shape:** `--r-badge-a` 4px(뱃지만), `--r-chip` 6px(Role Tab·Filter), `--r-pill` 999 **텍스트 폐기**(토글/아이콘만).
- **Heights:** `--role-tab-h` 34, `--chip-h` 32, `--btn-detail-h` 40 / `-m` 44.
- **카드 「상세 보기」:** Secondary (흰+primary 텍스트/보더). 페이지 CTA만 Primary.
- **Paid:** `--paid-bg #F6F1E8`, surface/line/ink/muted/selected (plans ivory). CTA 여전히 Primary.
- 상세: `TOKENS.md`.

---

## 3. Exceptions / unresolved

- 뱃지 4px 확정(보드). 텍스트 999 pill 폐기. Role Tab·Filter = 6px. 카드 상세 = Secondary.
- 가격 공란: **영역 숨김** + 정책 TBD 캡션. 「가격 문의」 미발명.
- Notion UDX 문서: 본 런 fetch 안 함.
- 모바일 GNB/하단탭, 로그인 게이트 카피: 미확정 유지.
- 전체: `EXCEPTIONS.md`.

---

## 4. Capture checklist results

서버: `python3 -m http.server 8791` → `capture.py`.

| Shot | Size | Result |
|------|------|--------|
| `shots/foundation-1440.png` | 1440×2626 | OK |
| `shots/badge-radius-1440.png` | 1440×701 | OK — A/B/C 병치 |
| `shots/vertical-rhythm-1440.png` | 1440×1235 | OK — 의미 그룹 구분 |
| `shots/role-modes-1440.png` | 1440×748 | OK — CTA 공통 블루, 액센트만 상이 |
| `shots/cards-1440.png` | 1440×2112 | OK — 가격유무·긴이름·사진유무 |
| `shots/cards-390.png` | 390×4525 | OK — 동일 데이터 스택 |
| `shots/banners-1440.png` | 1440×1146 | OK |
| `shots/paid-context-1440.png` | 1440×700 | OK — B ivory 권장 |
| `shots/responsive-shell-1440.png` | 1440×784 | OK |
| `shots/responsive-shell-768.png` | 768×1112 | OK |
| `shots/responsive-shell-390.png` | 390×1192 | OK — CTA ≥44px 규칙 적용 |

육안 점검 (캡처 기준):

- [x] 가로 오버플로 없음 (보드 max-width / 그리드 래핑)
- [x] 텍스트·버튼 겹침 없음
- [x] 뱃지 클리핑 없음
- [x] 이미지 왜곡 없음 (4:3 / 88sq empty frames)
- [x] 모바일 CTA min-height 44px (`@media max-width 768`)
- [x] 모바일 간격 맹목 반분 없음 (rhythm 표준 섹션갭만 48→32)
- [x] 제목/이미지/본문 그룹 유지

---



---

## 6. Shape-system patch (2026-09-08 KST)

| 항목 | 변경 |
|------|------|
| 뱃지 | radius **4px only** · h 20–22 · NO pill |
| Role Tab | `.mode-chip` → `.role-tab` · r6 · h 32–36 · px 12 · selected soft+role border |
| Filter chip | r6 · ≥32 · px 12 · icon + `aria-pressed` · 모바일 터치 ≥44 · 999 금지 |
| 텍스트 pill | sitewide deprecate · `--r-pill` = toggle/icon-only only |
| 카드 CTA | 「상세」/「자세히 보기」→ **「상세 보기」** · Secondary · h40/44 |
| 페이지 CTA | 「공부방찾기」「구매하기」등 Primary fill 유지 |
| BEFORE 백업 | `shots/before-shape/*.png` 유지 |
| 비교 | `09-shape-compare.html` + `shots/shape-compare/*.png` |
| ZIP | `stage5b-design-standard-v01.zip` · `stage5b-shape-compare-shots.zip` |
| 범위 | **stage5b-design-standard-v01 ONLY** · ops/GitHub/DB/API/stage5a/plans-ui-v5 **미수정** |
### Compare shot absolute paths

- `/workspace/study114-ds/stage5b-design-standard-v01/shots/shape-compare/compare-role-tabs.png`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/shape-compare/compare-filter-chips.png`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/shape-compare/compare-badges.png`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/shape-compare/compare-prime-detail.png`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/shape-compare/compare-pick-detail.png`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/shape-compare/compare-basic-detail.png`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/shape-compare/compare-desktop-390.png`

ZIP: `/workspace/study114-ds/stage5b-design-standard-v01.zip` · `/workspace/study114-ds/stage5b-shape-compare-shots.zip`

ops / GitHub / DB / API / stage5a / plans-ui-v5: **미수정 확인**.


## 5. Explicit scope statement

- **5B 최종 승인 아님.** 시각 판단용 초안 보드.
- **ops / GitHub / DB / API / routes 변경 없음.**
- stage5a 팩·plans-ui-v5 소스는 읽기·폰트 복사·ivory 토큰 참조만.
- 모든 화면 카피·수치는 **디자인 검증용 가상 데이터**.


---

## 7. Search button shape patch (2026-09-08) — superseded by §8

- Initial patch used min-width **64** (visual FAIL). Superseded by §8 re-patch to **≥72**.
- Historical shots: `shots/search-btn-compare/` · ZIP `stage5b-search-btn-compare-shots.zip`

## 8. Search button 72px re-patch (2026-09-08 KST)

- **SSOT (pack):** `ssot/UDX-STD-001-Button.md` — 검색 ≥72×40 desktop / ≥72×44 mobile; **64 = FAIL**.
- **Notion UDX-STD-001:** live page **not updated this run** (MCP/auth unavailable) — local pack SSOT is source of truth for this zip.
- Token: `--btn-search-min-w: 72px` · `--btn-search-h: 40px` · `--btn-search-h-m: 44px`.
- CSS: `.btn--search` uses `min-width: var(--btn-search-min-w)`; `width: auto`; `aspect-ratio: auto` (not 40/44 fixed width / not square). **`.btn--detail` CSS untouched.**
- Compare board: `10-search-btn-compare.html` mobile card-stack (no wide side-by-side table).
- Playwright true viewport: `innerWidth == clientWidth == 1440|390`; `scrollWidth <= clientWidth + 1` on shell + compare — **PASS**.
- Computed (Playwright chromium, DPR=1):
  - 검색 1440 = **72×40** · 390 = **72×44** (minWidth 72px)
  - 상세 1440 = **≈93.11×40** · 390 = **≈93.11×44** (minWidth 84px, unchanged rules)
- Shots: `shots/search-btn-72/` · ZIP `/workspace/study114-ds/stage5b-search-btn-72-shots.zip`
- Verifier: `verify_search_btn_72.py`
- ops / GitHub / DB / API / routes: **미수정**.


---

## 9. Filter chip ≤768 min-height 44 — regression (2026-09-08)

- Playwright: 768 / 390 / 360 chip **height 44**; 1440 chip **32** (desktop unchanged).
- Search unchanged: 1440 **72×40**, ≤768 **72×44**. Detail unchanged: h40/44, min-width 84 (≈94).
- scrollWidth ≤ clientWidth at 768/390/360/1440 — overflow PASS. No chip/search overlap.
- Shots: `shots/chip44-regression/` · ZIP `stage5b-chip44-regression-shots.zip`
- **형태·버튼 보정 최종 PASS** (전체 Stage 5B 완료·v1.0 잠금 아님).

---

## 10. Stage 5B COMMON gate audit (2026-09-08 KST)

- Audit report: [`GATE-AUDIT.md`](./GATE-AUDIT.md)
- Fresh Chip44 + width QA captures: `shots/gate-audit/`
- Chip44 JSON: `shots/gate-audit/computed-sizes-chip44.json`
- Measurements: `shots/gate-audit/gate-measurements.json`
- Zip: `/workspace/study114-ds/stage5b-gate-audit-chip44-shots.zip`
- **공통 디자인: FAIL** · **유료상품 통합: HOLD** · **전체 Stage 5B / v1.0: 미판정**
- Chip44 regression alone: **PASS** (768/390/360 chip h44; 1440 chip ~32; search 72×40/44; detail minW84 h40/44; no overflow)
- Blocking FAILs (not fixed this run): Basic@768 → 1-col; Pick@≤719 still 2-col; mobile GNB clip; Prime@960 → 2-col vs 5A; missing `prefers-reduced-motion`
- Scope: audit report + gate-audit shots only · CSS/HTML/ops/GitHub/DB/API/routes/plans-ui-v5 **미수정**

---

## Layout Axis (Stage 5B · horizontal unify) — 2026-09-08 KST

**Initial unify (1360-era):** PASS archived under `shots/layout-axis/archive-1360/` (보완 전 제출본).

### 11. Layout Axis 1280 complement (UDX-STD-001 Shell) — 2026-09-08 KST

**Gate:** `Stage 5B 1440px 정적 레이아웃 가로축: PASS`  
**Label:** 「Stage 5B 정적 기준안의 computed 실측」 — NOT 「현재 구축/운영 실측」.

**Shell definition:** max-width **1280 border-box** · gutter **32+32** → content **1216** · Type A body **892** · Type B body **648** · gap 24 · nav 220 · rail 300 · outer @1440 = 80/80.  
Formulas: `32+892+24+300+32=1280` · `32+220+24+648+24+300+32=1280` (≤1px).

**Created/updated:** `layout/layout.css` padding-inline gutter; `LAYOUT-AXIS.md` rewrite; `verify_layout_axis_1280.py`; shots after/overlay/formula/card/pass; `shots/layout-axis-1280/integrity.json`.

**Card regression:** Prime 3 equal ≤1px · Pick 5×2=10 · Basic 2×10=20 + numeric pagination — PASS. Search 72×40 / chip h32 / detail Secondary untouched.

**Artifacts:**
- `/workspace/study114-ds/stage5b-design-standard-v01/LAYOUT-AXIS.md`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/layout-axis/layout-measure-after.json`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/layout-axis/formula-check-1280.json`
- `/workspace/study114-ds/stage5b-design-standard-v01/shots/layout-axis/card-regression-1280.json`
- `/workspace/study114-ds/stage5b-layout-axis-1280-complete.zip`

**Follow-ups:** 960/768/mobile GNB/Pick/reduced-motion — 후속 게이트.  
**Not declared:** common design / Stage 5B complete / v1.0 / ops verified / Cursor ready / paid merge.


### 12. Layout Axis 1280 pack complement — integrity + Type B Pick (2026-09-08 07:59 KST)

**Separate judgments:**

| Judgment | Result |
|---|---|
| 1. 1440px 정적 레이아웃 가로축 수치 | **PASS** 유지 (1280/32/24/892/220/648/300/80) |
| 2. 완전 재현 ZIP 무결성 | **PASS** (html+css scanned=31, local_refs=177, missing=[]) |
| 3. Type B Pick 가독성 | **FAIL** (5-col baseline kept; column rule not locked) |
| 4. 공통 디자인 / Stage 5B 완료 / v1.0 / 운영 검증 | **미선언** |

**Integrity fix:** `09-shape-compare.html` local `shots/before-shape/{role-modes,responsive-shell,badge-radius,cards}-1440.png` + `responsive-shell-390.png` were missing from prior ZIP; real files included. Full recursive HTML/CSS ref scan → `shots/layout-axis-1280/full-ref-scan.log`.

**Pick:** No production CSS patch on `layout/plans.html`. Typography+ellipsis trial rejected. Proposal captures only under `shots/layout-axis/pick-alts/` + alt HTML pages.

**Changed files:** see `CHANGED.md`.

**ZIP:** `/workspace/study114-ds/stage5b-layout-axis-1280-complete.zip`  
**Stop:** no 960/768/mobile gates in this complement.
