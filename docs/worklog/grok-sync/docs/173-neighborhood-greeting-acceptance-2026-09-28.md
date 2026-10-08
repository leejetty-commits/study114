# 173 · Strong-review ACCEPT · 동네 인사 REWORK (neighborhood greeting)

- 일시: 2026-09-28 ~23:11–23:15 KST (Asia/Seoul)
- 심사: Strong-review · Cursor 불신 · 실머신 `D:\work\study114` `git show 6c32037` / `diff 4170d9d..6c32037` / 소스 대조
- machineId: `6aa2b772-d71e-4241-bcd4-3c985bf73991`
- 커밋: `6c32037829c9807a07faf69eaa924618a24f386e` (로컬 · `feat/student-mypage-a-g` · **origin/main ahead 2 · 미푸시**)
- 직전 REJECT: `4170d9d308f6f1dbe316a41be7730394a8ae7b74`
- push / `build:dothome` / Notion / 추가 커밋: **없음** (심사 준수)
- SSOT: [172](172-neighborhood-greeting-policy-2026-09-27.md) · [173](173-neighborhood-greeting-cursor-ticket-2026-09-28.md)
- 사용자 스모크(재주장 금지): skip→`#/study-room` · guest one-line gate · study-room id1 popup · missing id unavailable · server 400 bad reg/student save. **본 심사는 코드·diff 대조만. 라이브 UI 재실증 안 함.**

---

## 0. 판정

**ACCEPT.**

직전 REJECT 실패 4건(Must 2·5·6·8 품질)이 `6c32037`에서 **정본 카피·전용 게이트·registration_id 카드 API·서버 선반영 저장**으로 고쳐졌고, 유지 PASS(Must 1·3·4·7)도 깨지지 않았다. localStorage-only 성공·deep-gate 재사용·assertOwns DB skip 밴드에이드는 제거됨.

---

## 1. 커밋·파일

| 항목 | 값 |
|------|-----|
| 메시지 | `fix(home): save neighborhood greetings only after the server accepts them.` |
| 통계 | 6 files · +310 / −180 |
| 원격 | **미포함** (`origin/main..HEAD` = 2 · 4170d9d+6c32037) |

### 터치 파일 (전부)

1. `preview/auth-ui/src/screens/signup-complete.js`
2. `preview/auth-ui/src/styles/base.css`
3. `preview/home-ui/src/neighborhood-greeting-ui.js`
4. `preview/shared/neighborhood-greeting-store.js`
5. `public/api/neighborhood-greeting-card.php` **(신규)**
6. `src/Neighborhood/NeighborhoodGreetingService.php`

---

## 2. 직전 REJECT 실패 → 재검증

| # | 직전 실패 | 결과 | 증거 |
|---|-----------|------|------|
| A | signup-complete 본문 정본 · CTA 「인사 올리기」/「건너뛰기」동등 · skip→역할 홈 | **PASS** | 본문 exact `signup-complete.js:55`. CTA 둘 다 `btn btn--secondary` (`:60–61`) · CSS `.ng-prompt-modal__actions .btn { flex: 1 1 0; }` (`base.css`). skip → `goRoleHome()` → `roleHomeUrl` → `homeUiUrl('study-room'|'tutor')` = `#/study-room`/`#/tutor` (`:205–210`, `:44–47`). prompt-only remove **제거**. |
| B | 게스트 전용 게이트 「로그인하면 카드를 볼 수 있어요」 · NO `openDeepAccessLoginGate` | **PASS** | `openGreetingLoginGate` (`neighborhood-greeting-ui.js:189–210`) 본문 exact `:198`. `openDeepAccessLoginGate` import/호출 **0** (greeting-ui). deep bullets 없음. (공용 deep-gate는 compare/myshop 등 **다른** 경로에만 잔존 — 레일 무관) |
| C | 로그인 카드 `registration_id`로 풀/시드 밖 조회 · 불가 시 「카드를 볼 수 없어요」만 | **PASS(코드)** | `GET /api/neighborhood-greeting-card.php` (`neighborhood-greeting-card.php`) → `NeighborhoodGreetingService::basicCard` → study_room=`StudyRoomPublicReadService::getPublishedById` · tutor=`tutorBasicCard` (`Service.php:166–175`). 404/unavailable → `showCardUnavailable` exact 「카드를 볼 수 없어요」 (`greeting-ui.js:248–249`, API `:40`). closed 경로에서 로컬 폴백 **없음**. *API error(500/네트워크) 시에만* `resolveDetailItem` 폴백(`:108–114`) — 주경로 아님. 라이브 팝업은 사용자 스모크에 맡김(재주장 금지). |
| D | 저장=서버 소유권 필수 · localStorage-only 침묵 성공 금지 · assertOwns DB fail skip 금지 | **PASS** | `publishGreeting`/`unpublishGreeting`: `await pushGreeting` **성공 후**에만 `writeGreetings` (`store.js:51–72`). push 실패 → `{ok:false}` 사용자 에러. 쿠키/해시 핸드오프 저장 경로 **삭제**(clear only). `assertOwns`: try/catch skip **제거** · `Connection::get()` 실패는 RuntimeException → API 500 (`Service.php:223–234`, `neighborhood-greetings.php` catch). 소유권 불일치 → InvalidArgumentException → **400**. |

---

## 3. Must 1–8

| # | Must | 결과 | 증거 |
|---|------|------|------|
| 1 | 공부방·과외쌤만 · ≤80 · 등록 ID · 학생 인사 없음 | **PASS** | PHP role `tutor`/`study_room_owner` only. 모달은 `study_room\|\|tutor`만 (`signup-complete.js:202`). `maxlength="80"`. `registrationId`≥1. |
| 2 | 모달 정본 + 동등 CTA + 건너뛰기→홈 | **PASS** | §2-A |
| 3 | 마이 허브 수정·내리기 | **PASS** | `study-room-reg/screens.js` · `tutor-reg/screens.js` editor bind 유지. save/down 모두 `await` 서버 반영 (`greeting-ui.js:156–185`). |
| 4 | 홈 레일 · 제목 · 0건 숨김 · 같은 동네 | **PASS** | 제목 `우리 동네에 새로 왔어요` (`:67–68`). `items.length===0` → `''` (`:51`). `sameNeighborhood` (`:49`). |
| 5 | 로그인 → 베이직카드 · 불가 「카드를 볼 수 없어요」 | **PASS(코드) / 블라인드(실UI)** | §2-C. 사용자 스모크(id1 popup·missing unavailable) 재주장 안 함. |
| 6 | 게스트 가림·20자·전용 한 줄 게이트 | **PASS** | §2-B. teaser/mask 유지. |
| 7 | 전화/카톡/URL · 이미지 없음 · 7.x·랭킹 없음 | **PASS** | JS/PHP validate 동형. ranking/score/7.1·7.2·7.4 grep 0 in greeting 경로. |
| 8 | 실 persistence (API/store) | **PASS** | §2-D. JSON 파일 스토어 + GET/POST API. mock-only 아님. |

---

## 4. 밴드에이드 점검 (제거됨 / 잔여)

| 항목 | 상태 |
|------|------|
| 게스트 deep-gate 재사용 | **제거** (전용 `openGreetingLoginGate`) |
| 가입 skip=prompt 제거만 | **제거** (`goRoleHome`) |
| localStorage 선성공 + `void pushGreeting` | **제거** (서버 ok 후 로컬) |
| 쿠키/해시를 저장 핸드오프로 사용 | **제거** (clear only) |
| assertOwns DB fail skip | **제거** |
| 카드 오픈=풀/시드 only | **주경로 제거** (card API). *잔여*: API error 시 local `resolveDetailItem` 폴백 — 폐쇄(404) 경로에는 적용 안 됨. ACCEPT 저해 아님. |

---

## 5. 블라인드 스포트 (이번 미실증)

- PHP 세션 켠 환경에서 레일 클릭 → 실 베이직카드 팝업 DOM(사용자 스모크에 위임).
- POST 성공 시 `storage/neighborhood-greetings.json` 타 세션 GET 가시성(코드 경로는 존재).
- 게스트 게이트에 로그인 버튼 없음(정본 「한 줄만」준수) — UX 후속 가능.

---

## 6. Cursor 재작업 지시

**(ACCEPT — 재작업 paste 불필요)**

유지 금지: push · `build:dothome` · Notion · 독촉/랭킹가산 · 학생 인사 · 7.x 환영.

---

## 7. 변경 이력

| 일시 (KST) | 내용 |
|------------|------|
| 2026-09-28 ~22:52–23:05 | 4170d9d Strong-review **REJECT**. Must 2·6 하드 실패. Must 5·8 품질 경고. |
| 2026-09-28 ~23:11–23:15 | 6c32037 Strong-review **ACCEPT**. 직전 실패 4건 코드 수정 확인. 미푸시. |
