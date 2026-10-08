# 112 · Cursor — 홈 팝업 Phase 1a (셸 + set-a 공지·이벤트·광고 · 관리자만)

- 작성일: 2026-09-25 (KST)
- 화면: **손님 홈 / 공부방·과외쌤·학생 로그인 홈** 위에 뜨는 **모달 창**(게시판·관리자 설정 화면 안이 아님)
- 단계: **053 Phase 1a** · 정책 SSOT [111](111-home-popup-audience-and-layout-lock.md) · 순서 [053](053-home-popup-implementation-order.md)
- 시안 원본(필수 첨부·대조): `study114-ds/home-popup-drafts-pack6-v1.2`
  - HANDOFF.md · NOTES.md · `tokens.css` · `board.css` · `brand.css`
  - HTML: `set-a/a-notice.html` · `set-a/b-event.html` · `set-a/c-promo.html`
  - 샷(카드 크롭): `shots/set-a-a-notice-card.png` · `set-a-b-event-card.png` · `set-a-c-promo-card.png`
  - lockup PNG: `assets/logo-lockup-pencil-wordmark-h40.png` · `h64` · `h80` (및 마스터)
- 상태: **로컬만** · push / `build:dothome` / Deploy to dothome **금지** (사용자가 「배포」라고 말하기 전)
- 기준 HEAD: `origin/main` ≈ `5c12a5d` (Cursor가 `git log -1 --oneline` 재확인). 홈/찾기·가입 dirty와 **커밋·stage 분리**
- **스크린샷(필수):** Cursor 채팅에 set-a 카드 PNG 3장 **반드시 첨부**. 박스 경로  
  `/workspace/study114-ds/home-popup-drafts-pack6-v1.2/shots/set-a-*-card.png`

---

## 0. 한 줄 (화면 이름)

홈 위에 **시안과 같은 모양**의 팝업 창(공지·이벤트·광고)을 만들고, **관리자로 로그인한 사람만** 더미로 볼 수 있게 한다.  
set-b(워터마크)·대상 복수·API/DB·관리자 저장 폼 개편은 **이번 티켓 밖**(1b·2·3–4).

---

## 1. 잠금 정책 (화면 언어)

1. **무엇을**  
   - 유형 3종: **공지** / **이벤트** / **광고** (시안 set-a만).  
   - 패밀리 set-b·워터마크 **하지 않음**.

2. **누가 보나 (1a)**  
   - `isAdminUser()` 가 참인 세션만 홈에서 이 모달을 본다.  
   - 손님·공부방·과외쌤·학생(관리자 아닌)은 **절대 안 뜸**.  
   - 관리자 콘솔(`#/admin/...`) 안이 아니라 **실제 홈 위**에서 본다.

3. **동시에**  
   - 화면에 팝업 **최대 1개**.

4. **오늘 하루 보지 않기**  
   - UI에 체크+문구를 넣는다.  
   - **미리보기(관리자만)에서는 무시** — 체크해도 다음 진입에 다시 보여도 된다(매번 확인용). 저장 키를 쓰더라도 관리자 미리보기 경로에서는 읽지 말 것.

5. **닫기**  
   - 우상단 **밝은 흰 원형** × · ESC · (가능하면) 포커스 트랩.  
   - 어두운(다크) 원형 X **금지**.

6. **로고**  
   - 연필+「우동공과」 **합본 PNG 한 장**만 (`brand-lockup`). 아이콘·글자 분리·orphan 「우」 **금지**.  
   - `logo-full.png` 2줄 로고를 1차 lockup으로 **쓰지 않음**.  
   - 저장소에 lockup 파일이 없으면 시안 `assets/` 의 `logo-lockup-pencil-wordmark-*.png` 를  
     `public/assets/brand/` **및** `preview/home-ui/public/assets/brand/` 에 복사해 넣는다(allowlist).

7. **들여쓰기**  
   - 제목(`popup-title`) **아래**만 ≈14px (`--popup-body-indent`).  
   - 들여씀: 본문·목록·피치 · 제목 아래 배지/기간 칩 · **CTA 행**.  
   - flush: 제목 · 헤더 「공지/안내」배지 · 메타 · lockup · 「오늘 하루 보지 않기」.  
   - 이벤트 「Autumn Offer」 왼쪽 = lockup `<img>` 왼쪽.

8. **색**  
   - 팝업 CTA/패널에 **사이트 블루 `#266BC4` fill 금지**. 네이비·차콜 fill 금지.  
   - 토큰은 시안 `tokens.css` 값을 홈 전용 CSS로 옮긴다(111 §3-6 표).

9. **크기(데스크톱)**  
   - 공지 420×480 · 이벤트 400×560 · 광고 560×360.  
   - 모바일: `max-width: min(100vw − 32px, 카드가로)` · `max-height: 80vh` · 카드 안 스크롤.  
   - 광고만 ≤768px **세로 스택**(민트 위 · 본문 아래).

10. **더미 전환**  
    - 관리자 미리보기 중에 유형을 **공지 / 이벤트 / 광고**로 바꿔 볼 수 있는 작은 스위치(홈 구석 또는 쿼리 `?popupDemo=notice|event|promo` 등)를 둔다.  
    - 일반 회원에게 스위치 **노출 금지**.

11. **기존 관리자 sessionStorage 팝업**  
    - `#/admin/settings/popups` + `study114-site-popups-v1` 의 **납작한** `ops-chrome__popup`(제목·본문만)은  
      **관리자 미리보기 경로에서 시안 모달로 대체**하거나, enabled 납작 팝업이 시안 모달과 **동시에 뜨지 않게** 한다(최대 1개).  
    - 이번 티켓에서 관리자 폼 필드(유형·패밀리·대상) **개편 금지** — 그건 Phase 4.

---

## 2. 코드 조사 결과 (경로 · Cursor가 재확인 후 수정)

조사일 2026-09-25 · `origin/main` `5c12a5d` 원격 조회.

| # | 구간 | 파일 | 현재 |
|---|------|------|------|
| 1 | 홈 마운트 | `preview/home-ui/src/main.js` | 홈 그린 뒤 `mountOpsChrome(app)` |
| 2 | 기존 팝업 레이어 | `preview/home-ui/src/site-ops-chrome.js` | sessionStorage 활성 팝업 1건을 **납작 패널**로 그림. 역할 홈 surface를 `search`로 매핑 |
| 3 | 저장 Lab | `preview/home-ui/src/admin/site-settings-store.js` | `POPUPS_KEY=study114-site-popups-v1` · surface=`guest_home\|search\|mypage\|all` · **유형/패밀리/대상 없음** · dismiss는 시간(hours) |
| 4 | 관리자 UI | `preview/home-ui/src/admin/a28-screens.js` · `a28-screens-bind.js` · `#/admin/settings/popups` | 내용·surface·기간·enabled Lab. **이번 티켓에서 UI 확장 금지** |
| 5 | 관리자 판별 | `preview/home-ui/src/auth-session.js` `isAdminUser()` | `admin_level` 또는 `role_type==='admin'` |
| 6 | 브랜드 에셋 | `public/assets/brand/` · `preview/home-ui/public/assets/brand/` | `logo-wordmark.png` · `logo-full.png` 있음. **lockup 합본 PNG 없음** → 시안에서 복사 필요 |
| 7 | 모달 참고 | `preview/home-ui/src/compare-modal.js` · `student-detail-modal.js` | ESC/오버레이 패턴 참고 가능. 팝업 시안 레이아웃과 **혼용 금지** |
| 8 | 시안 CSS | 박스 `study114-ds/home-popup-drafts-pack6-v1.2/{tokens,board,brand}.css` | 구현 레퍼런스. 시안 HTML을 관리자에 업로드 **금지** |

가설(비구속): 1a는 `site-ops-chrome` 옆에 **홈 팝업 모듈을 신설**하고, `isAdminUser()`일 때만 시안 템플릿을 마운트하는 편이 납작 팝업·점검 배너와 섞이지 않기 쉽다. Cursor가 더 나은 최소 경로를 택해도 되나 **스모크·금지항은 동일**.

---

## 3. 구조 잠금 (시안 set-a)

### 3-1. 공지 (A)

1. 왼쪽 앰버 세로 줄무늬  
2. 우상단 흰 X · lockup ≈28px  
3. 배지 「공지」 · 메타 flush  
4. 제목 flush  
5. 들여쓰기: 리드 + 불릿  
6. CTA 행(들여쓰기 시작선): 「자세히 보기」(앰버) + 「닫기」 텍스트  
7. 「오늘 하루 보지 않기」

### 3-2. 이벤트 (B)

1. 코랄 그라데이션 히어로: lockup ≈48px + 캡션(왼쪽=lockup 왼쪽)  
2. 크림 본문: 제목 flush  
3. 들여쓰기: EVENT · 혜택 · 기간 칩 · 본문  
4. CTA 「이벤트 참여하기」(들여쓰기 시작선)  
5. 「오늘 하루 보지 않기」

### 3-3. 광고 (C)

1. 왼쪽 민트: lockup ≈64px + 짧은 브랜드 문구  
2. 오른쪽 흰: 「안내」flush · 제목 flush · 들여쓰기 피치 · CTA 「바로 찾기」(틸)  
3. ≤768 세로 스택

더미 카피·일정은 시안 HTML 문구를 그대로 써도 된다(하드코드 OK).

---

## 4. 수정 잠금 (구현 지시)

1. **신설(권장)**  
   - 예: `preview/home-ui/src/home-popup/`  
     - `shell.js` (오버레이·ESC·포커스·하루안보기 UI·관리자 게이트)  
     - `templates-set-a.js` (notice / event / promo 마크업)  
     - `demo-seed.js` (더미 props + 유형 전환)  
   - CSS: `preview/home-ui/src/styles/home-popup.css` (시안 토큰·레이아웃 이식). `main.js`에 import.

2. **마운트**  
   - 손님·역할 홈이 그려진 뒤(기존 `mountOpsChrome` 근처) 관리자만 시안 모달 마운트.  
   - 관리자 콘솔 라우트에서는 마운트하지 않음.

3. **에셋**  
   - lockup PNG를 brand 경로에 추가하고, `<img class="brand-lockup" alt="우동공과">` 로만 참조.

4. **기존 ops 납작 팝업**  
   - 관리자 미리보기 중 시안 모달이 뜰 때는 납작 팝업 **비표시**(또는 enabled 납작을 무시).  
   - 비관리자 동작·점검/게스트 배너는 **회귀 없이** 유지.

5. **하지 않음**  
   - set-b 워터마크  
   - 대상(전체·비회원·역할) 매칭 엔진  
   - API/DB · sessionStorage 스키마 확장 · a28 팝업 폼 필드 추가  
   - 공지 게시판 연동  
   - push / `build:dothome`

---

## 5. Allowlist (B)

```
preview/home-ui/src/home-popup/**          # 신설 권장
preview/home-ui/src/styles/home-popup.css  # 신설
preview/home-ui/src/main.js                # CSS import · 마운트 호출만
preview/home-ui/src/site-ops-chrome.js     # 납작 팝업과 충돌 방지(최소)
public/assets/brand/logo-lockup-pencil-wordmark.png
public/assets/brand/logo-lockup-pencil-wordmark-h40.png
public/assets/brand/logo-lockup-pencil-wordmark-h64.png
public/assets/brand/logo-lockup-pencil-wordmark-h80.png
preview/home-ui/public/assets/brand/logo-lockup-pencil-wordmark.png
preview/home-ui/public/assets/brand/logo-lockup-pencil-wordmark-h40.png
preview/home-ui/public/assets/brand/logo-lockup-pencil-wordmark-h64.png
preview/home-ui/public/assets/brand/logo-lockup-pencil-wordmark-h80.png
```

필요 시에만(최소·보고):

```
preview/home-ui/src/auth-session.js        # isAdminUser import만 — 로직 변경 금지 권장
preview/home-ui/src/state.js               # 홈 화면 판별 재사용만
preview/home-ui/src/styles/home-admin.css  # ops 팝업 충돌 시 최소
```

unchanged면 skip·보고. allowlist 밖 필수면 **중단·보고**.

---

## 6. Forbidden (C)

```
preview/home-ui/src/admin/a28-screens.js
preview/home-ui/src/admin/a28-screens-bind.js
preview/home-ui/src/admin/a28-copy.js
preview/home-ui/src/admin/site-settings-store.js   # 스키마/폼 확장 금지(1a). 읽기·충돌방지 외 변경 금지
public/api/** · src/** · sql/**
preview/search-ui/** · preview/auth-ui/**
preview/home-ui/src/exposure-render.js · provider-home.js · screens/tutor.js 등 홈 UI 타축
.git add -A · git commit -a
push · build:dothome · Deploy to dothome
시안 HTML/ZIP을 관리자 업로드·정적 호스트로 서비스
사이트 블루 #266BC4 를 팝업 CTA/패널 fill로 사용
set-b 워터마크 · 대상 엔진 · 공개 표시 on
```

---

## 7. 스모크 체크리스트

1. **관리자** 로그인 → 손님 홈(`#/guest`)에서 set-a **공지** 모달이 시안과 같은 뼈대(줄무늬·lockup·들여쓰기·앰버 CTA·흰 X).  
2. 유형 전환 → **이벤트**(히어로·Autumn Offer 왼쪽 정렬·코랄) · **광고**(민트|흰·틸 CTA).  
3. 공부방·과외쌤·학생 **로그인 홈**에서도 관리자면 동일 모달(더미) 확인.  
4. **관리자 아님** 세션(또는 로그아웃) → 모달 **안 뜸**. 유형 스위치도 없음.  
5. ESC · X · 「닫기」로 닫힘. 미리보기에서 「오늘 하루 보지 않기」체크 후 새로고침해도 **다시 보임**(무시).  
6. 좁은 폭: 카드가 화면 안에 들어오고, 광고는 세로 스택.  
7. 팝업 CTA에 사이트 블루 fill **없음**. lockup이 합본 PNG.  
8. `#/admin/settings/popups` 폼이 **깨지지 않음**(이번 티켓에서 안 고치는 것이 정답).  
9. 점검 배너·게스트 배너 회귀 없음(켜져 있을 때).  
10. `git status`: B만 · push 안 함.  
11. 보고에 **첨부 시안 샷 3장 대조** 언급(+ 가능하면 구현 스크린샷).

---

## 8. 완료 보고 (Cursor → 기획)

1. diff 파일 목록(=B)  
2. 마운트 위치 · 관리자 게이트 방법  
3. 유형 전환 방법(스위치/쿼리)  
4. 납작 ops 팝업과 어떻게 충돌 막았는지  
5. lockup 에셋 복사 여부  
6. 스모크 1–11 결과  
7. 시안 샷 대비 남은 시각 차이(있으면 목록)  
8. 다음에 넘길 잔여: set-b(1b) / 대상엔진(2) / API·관리자(3–4)

---

## 9. Cursor 붙여넣기 (이 블록만)

```
[티켓 112 · 홈 팝업 Phase 1a · 로컬만]

목표: 홈 위 모달 셸 + set-a 공지·이벤트·광고 3종을 시안(pack6-v1.2)대로 구현.
표시: isAdminUser()만. 손님·일반 회원에게 비표시.
금지: push, build:dothome, set-b, 대상엔진, API/DB, a28 팝업 폼 확장, 시안 HTML 업로드,
      팝업에 사이트 블루 #266BC4 fill, logo-full을 lockup으로 사용.

필수 첨부: set-a-*-card.png 3장 + (가능하면) HANDOFF/NOTES.
SSOT: study114-ds/docs/112-home-popup-phase1a-set-a-shell-ticket.md
정책: docs/111 · 순서: docs/053 Phase 1a
시안 경로(개발자 박스/첨부): home-popup-drafts-pack6-v1.2/

기존 코드:
- mountOpsChrome → site-ops-chrome.js (납작 팝업) — 관리자 시안 모달과 동시 노출 금지
- site-settings-store.js sessionStorage Lab — 스키마 확장 금지
- isAdminUser → auth-session.js
- lockup PNG 없음 → 시안 assets에서 public/assets/brand/ (+ preview/home-ui/public/...) 복사

Allowlist / Forbidden / 스모크: 위 112 문서 §5–7 그대로.
끝나면 §8 보고. 커밋은 allowlist만·푸시 금지.
```

---

## 10. 관련

- [053](053-home-popup-implementation-order.md) · [111](111-home-popup-audience-and-layout-lock.md)
- 다음 예: 113 Phase 1b set-b · 114 Phase 2 표시 엔진
