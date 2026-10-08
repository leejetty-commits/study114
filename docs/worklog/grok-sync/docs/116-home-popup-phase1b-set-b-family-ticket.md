# 116 · Cursor — 홈 팝업 Phase 1b (set-b 워터마크 3종 + 패밀리 선택 · 관리자만)

- 작성일: 2026-09-25 (KST)
- 화면: **손님 홈 / 공부방·과외쌤·학생 로그인 홈** 위 모달 (관리자 설정 화면 안이 아님)
- 단계: **053 Phase 1b** · 정책 [111](111-home-popup-audience-and-layout-lock.md) · 순서 [053](053-home-popup-implementation-order.md)
- 선행 닫힘: Phase 1a [112](112-home-popup-phase1a-set-a-shell-ticket.md)→[113](113-home-popup-phase1a-112-acceptance.md)→[114](114-home-popup-phase1a-112-fixup-ticket.md)→[115](115-home-popup-phase1a-114-acceptance.md)
- 기준 HEAD(로컬): `345590b` (1a 셸 `f63924a` + 시안 맞춤 CSS). `origin/main`은 아직 `5c12a5d` — **푸시 금지**
- 시안: `study114-ds/home-popup-drafts-pack6-v1.2`
  - HTML: `set-b/a-notice.html` · `set-b/b-event.html` · `set-b/c-promo.html`
  - CSS: `brand.css` (`.brand-watermark` · `--br` / `--br-lg`) · `NOTES.md` set-b 표
  - 샷(카드): `shots/set-b-a-notice-card.png` · `set-b-b-event-card.png` · `set-b-c-promo-card.png`
  - 워터마크 원본: `assets/logo-wordmark.png`
- 상태: **로컬만** · push / `build:dothome` / Deploy **금지**
- **스크린샷(필수):** Cursor 채팅에 set-b 카드 PNG 3장 첨부

---

## 0. 한 줄 (화면 언어)

이미 있는 set-a(로고만) 위에, **옅은 「우동공과」 워드마크 워터마크**가 들어간 **set-b** 공지·이벤트·광고 세 장을 더하고, 관리자 미리보기에서 **패밀리(set-a / set-b)** 와 **유형(공지·이벤트·광고)** 을 골라 볼 수 있게 한다.  
대상·공개·하루 안 보기 저장·API/DB·관리자 저장 폼은 **이번 밖**(Phase 2·3–4).

---

## 1. 잠금 정책

1. **set-b란**  
   - set-a와 **같은 뼈대·크기·색·들여쓰기·CTA**.  
   - 차이: 카드 안에 **옅은 워드마크 워터마크** 한 장 (`logo-wordmark.png`).  
   - 위치(시안 NOTES):  
     - 공지: 본문 영역 **우하단** (BR)  
     - 이벤트: **크림 본문** 우하단  
     - 광고: **흰 본문(오른쪽)** 쪽 faint watermark (민트 패널이 아님)

2. **누가 보나**  
   - 계속 `isAdminUser()`만. 손님·일반 회원 **절대 안 뜸**.  
   - 게이트·납작 팝업 억제·하루 안 보기 무시(미리보기) **회귀 금지**.

3. **패밀리 + 유형 전환 (더미)**  
   - 관리자 미리보기 UI에  
     - 패밀리: **set-a / set-b**  
     - 유형: **공지 / 이벤트 / 광고**  
   - 페이지 쿼리 권장(해시 쿼리 금지 — 1a와 동일 이유):  
     - `?popupDemo=notice|event|ad` (유지)  
     - `?popupFamily=a|b` (신설, 기본 `a`)  
   - 스위치는 **관리자에게만**. 비관리자 노출 금지.

4. **레이아웃·색**  
   - 112/114/115에서 잠근 것 유지: 크기, 14px 들여쓰기, 흰 X, 블루 `#266BC4` fill 금지, 광고 ≤768 세로 스택, 이벤트 lockup·Autumn Offer **왼쪽**.

5. **에셋**  
   - 워터마크: `/assets/brand/logo-wordmark.png`  
   - 저장소에 이미 `public/assets/brand/logo-wordmark.png` · `preview/home-ui/public/assets/brand/logo-wordmark.png` 있음 → **없으면** 시안 `assets/logo-wordmark.png` 복사. 있으면 경로만 참조.  
   - lockup은 기존 합본 유지 OK. logo-full을 lockup/워터마크로 **쓰지 않음**.  
   - 워터마크 `<img alt="" aria-hidden="true">` · 클릭 방해 금지(`pointer-events: none`).

6. **하지 않음**  
   - 비관리자 공개 · 대상(전체·역할) 엔진 · 기간·우선순위 엔진 · 하루 안 보기 **저장**  
   - API/DB · `site-settings-store` 스키마 · a28 팝업 폼 필드(패밀리 필드 추가도 Phase 4)  
   - set-a 레이아웃 재翻新 · 시안 HTML 업로드 · push/빌드

---

## 2. 코드 조사 (1a 현재 · Cursor 재확인)

| # | 구간 | 파일 | 현재 |
|---|------|------|------|
| 1 | 게이트 | `home-popup/gate.js` | `isAdminUser` · 홈 surface · `popupDemo` · 납작 억제 |
| 2 | 마운트 | `home-popup/mount.js` | set-a 3종 마크업 · 유형 스위치만 |
| 3 | 카피 | `home-popup/content.js` | SET_A · LOCKUP_SRC |
| 4 | 스타일 | `styles/home-popup.css` | set-a · 768 스택 · 이벤트 왼쪽 |
| 5 | 워터마크 에셋 | `public/.../logo-wordmark.png` | **이미 있음**(양쪽) |

가설(비구속): `family === 'b'`일 때만 카드에 watermark `<img>` + CSS. 패밀리 스위치를 유형 스위치 옆에 두거나 한 줄로. Cursor가 최소 경로를 택해도 **스모크·금지항 동일**.

---

## 3. 구조 잠금 (set-b = set-a + watermark)

### 3-1. 공지
set-a와 동일 + 본문(또는 notice body) 안 **우하단** faded wordmark.

### 3-2. 이벤트
set-a와 동일(히어로 왼쪽 lockup·Autumn Offer) + **크림 본문** 우하단 watermark.

### 3-3. 광고
set-a와 동일(민트|흰 · ≤768 스택) + **흰 본문 쪽** faint watermark.

투명도·크기: 시안 `brand.css` 근사 (opacity ≈0.10–0.12 · height ≈36–40px · 살짝 기울기 `--br` OK).

---

## 4. 수정 잠금

1. `content.js`: `WATERMARK_SRC` · (필요 시) 패밀리 상수. 카피는 set-a와 공유해도 됨.  
2. `mount.js`: set-b일 때 watermark 삽입 · 패밀리 스위치 · `popupFamily` 읽기/쓰기.  
3. `gate.js`: `readPopupFamily` / `writePopupFamily` (페이지 쿼리). `shouldShowHomePopup` / 납작 억제는 **유지**.  
4. `home-popup.css`: `.home-popup__watermark` (+ 유형별 위치). set-a 레이아웃 **깨지 말 것**.  
5. `main.js` / `site-ops-chrome.js`: **가능하면 수정 없음**. 필요 시 중단·보고.

---

## 5. Allowlist (B)

```
preview/home-ui/src/home-popup/gate.js
preview/home-ui/src/home-popup/content.js
preview/home-ui/src/home-popup/mount.js
preview/home-ui/src/styles/home-popup.css
```

에셋 없을 때만:

```
public/assets/brand/logo-wordmark.png
preview/home-ui/public/assets/brand/logo-wordmark.png
```

(이미 있으면 skip·보고.)

unchanged면 skip. allowlist 밖 필수면 **중단·보고**.

---

## 6. Forbidden (C)

```
preview/home-ui/src/admin/** · site-settings-store.js 스키마/폼 확장
public/api/** · src/** · sql/**
preview/home-ui/src/main.js · site-ops-chrome.js   # 변경 필요하면 중단·보고
exposure-render / provider-home / screens/tutor 등 홈 타축
.git add -A · amend로 1a 커밋 덮기 · push · build:dothome
사이트 블루 #266BC4 fill · logo-full을 lockup/워터마크로 사용
대상 엔진 · 공개 표시 on · 하루 안 보기 저장
set-a 크기/들여쓰기/768/이벤트왼쪽 회귀
```

---

## 7. 스모크

1. 관리자 · `popupFamily=a`(기본): 기존 set-a와 동일 · **워터마크 없음**.  
2. 패밀리 **set-b** + 공지/이벤트/광고: 워터마크 위치·투명도가 시안 샷과 근사.  
3. 유형×패밀리 6조합 전환 가능.  
4. 비관리자·로그아웃: 모달·스위치 없음.  
5. 광고 폭 700: 세로 스택 유지(114). 이벤트: lockup·Autumn Offer 왼쪽 유지.  
6. 납작 팝업 억제·배너·하루 안 보기 무시 유지.  
7. `git status`: B만 · **새 커밋** · push 안 함.  
8. 보고에 set-b 시안 샷 3장 대조(+ 가능하면 구현 스크린샷).

---

## 8. 완료 보고 (Cursor → 기획)

1. diff 파일 목록  
2. `popupFamily` / 스위치 UI 방법  
3. 워터마크 경로 · 에셋 복사 여부  
4. 스모크 1–8  
5. set-a 회귀 유무  
6. 잔여: Phase 2 표시 엔진 / 3–4 API·관리자

---

## 9. Cursor 붙여넣기 (이 블록만)

```
[티켓 116 · 홈 팝업 Phase 1b · 로컬만]

목표: set-b(워터마크 imprint) 공지·이벤트·광고 3종 + 패밀리(set-a/set-b) 전환.
표시: isAdminUser()만. 게이트·납작억제·하루안보기무시·114 CSS(768·이벤트왼쪽) 회귀 금지.
기준: 로컬 345590b (1a 닫힘). push·build:dothome 금지. amend로 1a 덮지 말 것.

필수 첨부: set-b-*-card.png 3장.
시안: pack6-v1.2 set-b HTML + brand.css watermark · NOTES set-b 표.
워터마크: /assets/brand/logo-wordmark.png (repo에 이미 있으면 복사 생략).

쿼리: ?popupDemo=notice|event|ad 유지 + ?popupFamily=a|b 신설(기본 a). 해시 쿼리 금지.

Allowlist: home-popup/gate.js, content.js, mount.js, styles/home-popup.css
(+ wordmark 없을 때만 public brand 양쪽).
Forbidden: admin 폼/store 확장, API/DB, main.js·site-ops-chrome 변경(필요시 중단보고),
대상엔진·공개·하루안보기 저장, #266BC4 fill, logo-full.

끝나면 §8 보고. allowlist만 새 커밋·푸시 금지.
```

---

## 10. 관련

- [053](053-home-popup-implementation-order.md) · [111](111-home-popup-audience-and-layout-lock.md) · [115](115-home-popup-phase1a-114-acceptance.md)
- 다음 예: 117 Phase 2 표시 엔진 (대상·우선순위·하루 안 보기 저장) — **이번 티켓 아님**
