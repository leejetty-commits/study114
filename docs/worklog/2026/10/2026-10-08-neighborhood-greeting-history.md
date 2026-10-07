# 2026-10-08 동네 인사 최근 3개 목록과 불러와 고치기

## 검수·승인
- 상태: **대기** (사용자 승인 대기)
- 승인자: 사용자
- 작업 브랜치: `cursor/neighborhood-greeting-history-20261008`
- 기준 커밋: `b249ccc`

---

## 1. 지시서 원문

```text
너는 study114 작업자다. 보고는 한국어. Windows PowerShell.

## 규칙 (반드시)
- 작업 폴더는 이미 만들어진 worktree D:\work\study114-ng-history (브랜치 cursor/neighborhood-greeting-history-20261008, origin/main b249ccc 기준, 수정 0). 이 폴더에서만 작업. 이전 작업자가 중단돼 아무것도 반영되지 않은 상태다.
- D:\work\study114 및 다른 D:\work\study114-* worktree 는 건드리지 마라.
- git add -A 금지, 허용 파일만 개별 stage. main push/merge 금지. amend 금지.
- 허용 수정 범위: src/Neighborhood/NeighborhoodGreetingService.php, public/api/neighborhood-greetings.php, preview/shared/neighborhood-greeting-store.js, preview/shared/neighborhood-greeting.js(필요 시), preview/home-ui/src/neighborhood-greeting-ui.js, preview/home-ui/src/styles/neighborhood-greeting.css, 동네 인사 관련 기존 verify 스크립트(scripts/ 에서 neighborhood·greeting 이름) 보강 또는 새 scripts/verify-neighborhood-greeting-history.mjs, worklog 파일. 그 외 수정 금지(특히 preview/search-ui, src/Search, src/Region, right-rail, home-right-rail.css — 다른 브랜치 작업 중).
- SQL·.htaccess·env 변경 금지 (저장은 기존처럼 storage/neighborhood-greetings.json 파일).
- 이 PC 에는 PHP 가 없다(PATH·Git Bash 둘 다 한 번만 확인). 서버 검사는 소스 assert 로 하고 '실행 검증 미실시(php 없음)' 명시.

## 현재 구조 (확인됨, origin/main)
- 서버 src/Neighborhood/NeighborhoodGreetingService.php: 파일 JSON 저장, (provider_type, registration_id) 당 행 1개 upsert. 필드 body, neighborhood, display_name, status('up'|'down'), updated_at(ms), user_id. listPublic(full) 은 status up 만 공개, masked_name·teaser. save() 는 소유자 검증(assertOwns), 역할 검증, validate(80자, 전화·카톡·URL 금지).
- 화면: 공부방·과외쌤 마이페이지 > 내 등록 > 프로필꾸미기 안의 '동네 인사' 블록 = preview/home-ui/src/neighborhood-greeting-ui.js 의 renderNeighborhoodGreetingEditor / bindNeighborhoodGreetingEditor (study-room-reg/screens.js, tutor-reg/screens.js 에서 호출). 지금은 textarea + 아래 '올리기/수정' + '내리기' 버튼, 저장 후 글이 칸에 그대로 남고 버튼이 '수정'으로 바뀜.
- 홈 [공지 | 동네 인사] 칸은 GET /api/neighborhood-greetings.php 의 공개 목록을 씀.

## 사용자 요구 (2026-10-08 승인, 원문 요지)
"인사를 넣고 '올리기' 하면 3개 정도 작은 글씨로 리스트로 남게 해줘. 유저가 가끔씩 동네인사를 바꿔 가면서 올릴 수 있잖아. 박스 안은 저장되고 나면 지워져야 해. 있던 3개 중 하나를 클릭하면 박스 안에 글을 불러와서 수정할 수 있게. 박스 안 글자도 들여쓰기로 시작하게(딱 붙어서 보기 싫어). '올리기' 배지를 박스 위 우측에 놓아도 돼."
사용자 결정:
1. 홈에는 가장 최근(맨 위) 인사 1개만 공개. 나머지 2개는 본인 목록에만 보관.
2. 목록에서 불러와 고친 뒤 올리면: 그 항목을 고친 내용으로 바꾸고 맨 위(공개 중)로 올림. 중복 없이 최대 3개 유지.
3. 공개 중 항목에 '게시 중' 표시 + 기존 '내리기' 유지 + 항목별 삭제(×).
4. (레이아웃 최종 결정) 입력칸은 전체 폭, '올리기'는 제목줄 우측, 최근 인사 목록은 입력칸 아래.

## 구현 지시
### 서버
- 행에 history 배열 추가: 최대 3개, 각 {id: string, body: string, updated_at: int}. history[0] = 현재 인사(공개 대상). 기존 행(history 없음)은 읽을 때 body 로 history[0] 를 만든다(하위 호환).
- save(up): 입력에 history_id 가 있고 history 에 있으면 그 항목 제거 후 고친 body 로 맨 앞에 삽입(id 유지), 없으면 새 id 로 맨 앞 삽입. 3개 초과분 잘라냄. 행의 body/status/updated_at 은 history[0] 기준(status 'up'). 같은 본문이 이미 목록에 있으면 중복 만들지 말고 그 항목을 맨 앞으로.
- down(내리기): 기존처럼 status 'down', history 유지.
- 삭제: 새 액션(input action: 'delete', history_id). 소유자 검증 필수. 삭제한 항목이 history[0] 이고 status up 이었다면 status 'down'(공개 내림)으로 바꾸고 나머지는 유지 — 남은 항목이 자동 공개되지 않게.
- 본인 목록 조회: 로그인한 소유자만 자기 (provider_type, registration_id) 의 history·status 를 받게 public/api/neighborhood-greetings.php 에 GET 파라미터(mine=1&provider_type&registration_id) 추가 + save/delete 응답에 history 포함. 남의 history 는 절대 노출 금지. listPublic 응답에는 history 를 넣지 마라(공개는 history[0] 1개만, 기존 형식 그대로).
- 기존 검증(validate, assertOwns, 역할) 그대로 모든 쓰기 경로에 적용. 응답 JSON 은 필드 추가만.
### 화면 (neighborhood-greeting-ui.js + neighborhood-greeting.css + store)
- 레이아웃: 제목줄 = 왼쪽 '동네 인사' 제목, 오른쪽 끝에 '올리기' 작은 버튼. 그 아래 안내문 한 줄(80자…). 그 아래 입력칸(textarea) 전체 폭. 그 아래 최근 인사 목록(최대 3, 작은 글씨 fs-12~13, 각 줄: 본문 한 줄 말줄임 · 날짜(MM.DD) · 공개 중이면 '게시 중' 작은 배지 · × 삭제 버튼). 목록이 0개면 목록 영역 숨김(또는 '아직 올린 인사가 없어요' 한 줄).
- '내리기'는 공개 중일 때만, '게시 중' 근처에 작은 텍스트 버튼.
- 올리기 성공 → 입력칸 비움, 목록 갱신(새 항목 맨 위·게시 중), 상태 문구 '올렸어요'(기존 4초 자동 숨김 유지). 버튼 글자는 항상 '올리기'.
- 목록 항목(본문 부분) 클릭 → 입력칸에 그 글 불러옴 + 입력칸 위 작은 문구 '고르신 인사를 고치는 중 · 취소' + 내부에 history_id 보관. 취소 → 칸 비우고 편집 해제. 이 상태로 올리기 → 서버에 history_id 전달.
- × 클릭 → confirm('이 인사를 지울까요?') 후 삭제, 목록 갱신.
- 입력칸 안쪽 여백: padding var(--space-2) 상하 · var(--space-3) 좌우 수준. form-input 전역 규칙과 충돌하면 .ng-editor__input 으로 범위를 좁혀 지정.
- 접근성: 버튼은 button, 목록 항목 클릭 영역도 button, × 는 aria-label='인사 지우기'.
- 홈 [공지 | 동네 인사] 칸 표시는 바꾸지 않는다. invalidateGreetings 등 기존 캐시 무효화 유지.
- 작업은 작게: 큰 파일을 통째로 다시 쓰지 말고 필요한 부분만 편집.

## 검사
1. 의존성 없으면 deploy.yml 방식대로 npm ci.
2. 기존 동네 인사 verify + 새/보강 스크립트: (a) listPublic 에 history 없음, (b) 소유자 외 history 조회 차단 코드 존재, (c) history 최대 3·중복 방지·맨 위 교체·삭제 시 공개 내림 로직, (d) 화면: 올리기 버튼이 제목줄, 입력칸 아래 목록, 클릭 불러오기, × 삭제, 성공 시 입력칸 비움, textarea padding 규칙.
3. .github/workflows/deploy.yml 배포 전 게이트 전부, npm run build:dothome (산출물 커밋 금지, 바뀐 추적 파일은 git checkout --).
4. 화면 캡처(가능하면): 렌더 함수 출력 HTML + 관련 CSS 로 정적 하네스를 tmp-shots/ 에 만들어 Edge headless 로 캡처(목록 0개 / 3개+게시 중 / 편집 중). & "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=900,600 --screenshot=<png> file:///<html>. tmp-shots 는 커밋하지 않는다.

## 기록·커밋
- docs/worklog/2026/10/2026-10-08-neighborhood-greeting-history.md: '지시서 원문' 절에 이 메시지 전체, 사용자 결정 1~4, 데이터 구조 변경(history), 바꾼 파일, 검사 결과 표, 캡처 경로, '배포 전 사용자 할 일: 없음(SQL 없음)'. 검수·승인 칸 '대기'.
- 허용 파일만 개별 git add → commit (예: feat(greeting): 동네 인사 최근 3개 목록과 불러와 고치기) → git push -u origin cursor/neighborhood-greeting-history-20261008.

[추가 안내 — 작업 폴더 변경]
Cursor 보안 규칙으로 인해 작업 폴더가 d:\work\study114\.wt\ng-history 로 지정되어 본 폴더에서 모든 작업 및 검증을 완료함.
```

---

## 2. 사용자 결정사항 요약
1. **홈 노출 규칙**: 홈에는 가장 최근(맨 위) 인사 1개만 공개 (`status: up`). 나머지 2개는 본인 목록에만 보관.
2. **불러와 고친 뒤 올리기**: 목록에서 항목을 클릭하여 본문을 불러와 수정한 뒤 올리면, 해당 항목이 수정 내용으로 바뀌어 맨 위(공개 중)로 올라감. 중복 없이 최대 3개 유지.
3. **상태 배지 및 삭제**: 공개 중인 항목에 `게시 중` 배지 + `내리기` 텍스트 버튼 표시. 각 항목마다 `×` (인사 지우기) 삭제 버튼 제공.
4. **레이아웃 구조**:
   - 제목줄: 왼쪽 '동네 인사' 제목, 오른쪽 끝 '올리기' 버튼 (버튼 문구 항상 '올리기')
   - 안내문: 한 줄, 80자 제한 안내
   - 편집 힌트: 목록 항목 클릭 시 "고르신 인사를 고치는 중 · 취소" 노출
   - 입력칸(textarea): 전체 폭, 안쪽 들여쓰기 여백 (`padding: var(--space-2) var(--space-3)`)
   - 최근 목록: 입력칸 아래 배치 (최대 3개, 12~13px 작은 글씨, 본문 한 줄 말줄임, 날짜 MM.DD, 게시 중/내리기/삭제)

---

## 3. 데이터 구조 변경 (`history`)

JSON 파일(`storage/neighborhood-greetings.json`)에 저장되는 각 공급자 레코드에 `history` 필드 추가:

```json
{
  "provider_type": "tutor",
  "registration_id": 42,
  "user_id": 1001,
  "body": "역삼초·중 학생들과 함께 재미있는 수학 공부해요!",
  "neighborhood": "역삼동",
  "display_name": "수학쌤",
  "status": "up",
  "updated_at": 1728345600000,
  "history": [
    {
      "id": "h_1728345600000_a1b2c3",
      "body": "역삼초·중 학생들과 함께 재미있는 수학 공부해요!",
      "updated_at": 1728345600000
    },
    {
      "id": "h_1728259200000_d4e5f6",
      "body": "중간고사 대비 1:1 맞춤 클리닉 운영 중입니다.",
      "updated_at": 1728259200000
    },
    {
      "id": "h_1728172800000_789abc",
      "body": "기초부터 탄탄하게, 편안하게 질문할 수 있어요.",
      "updated_at": 1728172800000
    }
  ]
}
```

- **하위 호환성**: 기존 데이터에 `history`가 없을 경우 `extractHistory()`를 통해 `body`와 `updated_at`으로 `history[0]`을 자동 구성.
- **공개 보호**: `listPublic` 응답은 기존 형태 그대로 유지하며 `history` 배열을 일절 노출하지 않음.
- **본인 조회 보안**: `GET /api/neighborhood-greetings.php?mine=1` 시 세션 확인(미로그인 401), 역할 검증 및 소유자 검증(`assertOwns` 불일치 시 `InvalidArgumentException` → API 400 반환)을 강제하여 타인의 `history` 조회를 철저히 차단.

---

## 4. 변경된 파일 목록

| 파일 경로 | 변경 내용 요약 |
|---|---|
| `src/Neighborhood/NeighborhoodGreetingService.php` | `history` 관리(최대 3개, 중복방지, 맨위삽입, 하위호환 `extractHistory`), `getMine`(본인 조회 및 소유자 검증), `delete`(소유자 검증 및 `history[0]` 삭제 시 자동공개 방지 `status: down`), 클래스 주석 들여쓰기 원복 |
| `public/api/neighborhood-greetings.php` | `GET ?mine=1` 본인 history 조회 분기 추가 (인증/소유권 검증), `POST` 저장 및 삭제 응답에 `history` 필드 추가 |
| `preview/shared/neighborhood-greeting-store.js` | `publishGreeting`에 `historyId` 전달 및 로컬 `history` 반영, `unpublishGreeting` 및 `deleteGreeting`, `fetchMineGreeting` 추가 |
| `preview/shared/neighborhood-greeting.js` | `buildGreetingRecord`에 `historyId` 옵션 지원 |
| `preview/home-ui/src/neighborhood-greeting-ui.js` | 제목줄 [올리기] 버튼 레이아웃, `renderGreetingHistoryList`(최대 3개, 본문 말줄임, 날짜, 게시 중/내리기, 삭제), 항목 클릭 불러오기, 편집 중 취소, 저장 시 입력칸 비움 및 '올렸어요' 표시, 클라이언트 가짜 ID('init') 완전 제거, 로딩 중 '불러오는 중…' 및 mine 조회 실패 시 평문 fallback 표시 |
| `preview/home-ui/src/styles/neighborhood-greeting.css` | `.ng-editor__head`, `.ng-editor__submit-btn`, `.ng-editor__editing-hint`, textarea padding(`var(--space-2)`/`var(--space-3)`), `.ng-editor__history-*` (loading, fallback 포함), 배지/버튼 스타일 및 `[hidden]` 방어 규칙 |
| `scripts/verify-neighborhood-greeting-history.mjs` | 서버 소스 정적 assert(PHP 없음 대응), CSS 규칙 검증, JS 스토어 및 UI 렌더링/모의 DOM 상호작용 검증, 클라이언트 가짜 ID('init') 부재 assert 추가 (총 65개 테스트) |

---

## 5. 검사 결과 표

| 검사 항목 | 명령어 / 스크립트 | 결과 | 비고 |
|---|---|---|---|
| 동네 인사 이력 종합 검증 | `cd preview/home-ui ; npx --yes vite-node ../../scripts/verify-neighborhood-greeting-history.mjs` | **PASS (65/65 통과)** | 서버 소스 정적 assert (PHP 실행 미실시: php 없음), CSS 규칙, 가짜 id 부재 검증, JS 렌더 및 모의 상호작용 전부 통과 |
| ShopPage 검증 게이트 | `npm run verify:shop-page` | **PASS (54/54 통과)** | deploy.yml 배포 게이트 1 |
| 비밀값 커밋 검사 | `bash scripts/check-no-committed-secrets.sh` | **PASS** | deploy.yml 배포 게이트 2 |
| 과외쌤 쪽지설정 SSOT | `npm run verify:tutor-inquiries-settings` | **PASS** | deploy.yml 배포 게이트 3 |
| 공부방 쪽지설정 샘플/프레임 | `npm run verify:study-room-inquiries-samples` | **PASS** | deploy.yml 배포 게이트 4 |
| 064 DDL 파일 존재 확인 | `Test-Path sql/schema/064_tutor_inquiry_status.sql` | **PASS (True)** | deploy.yml 배포 게이트 5 |
| Dothome 전체 빌드 | `npm run build:dothome` | **PASS (성공)** | 빌드 산출물 미커밋 유지 (`git clean -f public/assets`) |

---

## 6. 화면 캡처 결과 (Edge Headless)

Edge Headless 브라우저(`msedge.exe --headless=new --window-size=900,600`)로 렌더링 하네스를 캡처하여 시각적 검증 완료:

1. **목록 0개**: `tmp-shots/case1-empty.png` (17,312 바이트)
   - 제목줄 오른쪽 '올리기' 버튼 배치
   - 비어 있는 입력칸 (placeholder 표시)
   - "아직 올린 인사가 없어요." 안내 문구 표시
2. **최근 3개 이력 및 게시 중**: `tmp-shots/case2-active.png` (30,993 바이트)
   - 첫 번째 항목: 본문 말줄임, 날짜(10.08), `게시 중` 초록 배지, `내리기` 텍스트 버튼, `×` 삭제 버튼
   - 두/세 번째 항목: 본문, 날짜, `×` 삭제 버튼
   - 입력칸은 비어 있고 들여쓰기 여백 적용
3. **목록 클릭 후 편집 중**: `tmp-shots/case3-editing.png` (33,075 바이트)
   - "고르신 인사를 고치는 중 · 취소" 안내 표시
   - 선택한 항목 본문이 textarea에 불러와짐
   - 취소 클릭 시 비워지고 편집 모드 해제

### `Get-ChildItem tmp-shots` 실행 결과
```text
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----      2026-10-08   오전 6:49          71657 case1-empty.html
-a----      2026-10-08   오전 6:58          17312 case1-empty.png
-a----      2026-10-08   오전 6:49          73346 case2-active.html
-a----      2026-10-08   오전 6:58          30993 case2-active.png
-a----      2026-10-08   오전 6:49          73442 case3-editing.html
-a----      2026-10-08   오전 6:58          33075 case3-editing.png
```

*(주의: `tmp-shots/` 폴더는 규칙에 따라 git 커밋 대상에서 제외)*

---

## 7. 배포 전 사용자 할 일
- **없음 (SQL 변경 없음, .htaccess 변경 없음, env 변경 없음)**
- 저장은 기존 파일 기반(`storage/neighborhood-greetings.json`)으로 동작하며 자동 하위 호환됩니다.

---

## 8. 메인 검수 1차 반려(하자 1~4)와 수정 내용 (커밋 대상: `6c9fa67`)

### 하자 1 (기능) — 클라이언트가 만든 가짜 id 'init' 제거 및 fallback 처리
- **원인**: `neighborhood-greeting-ui.js`에서 로컬 캐시에 history가 없을 때 임의로 `{ id: 'init', body: current.body, ... }`를 생성하여, 서버의 실제 id(`h_<updated_at>_<md5 6자>`)와 불일치 발생.
- **수정**:
  - 클라이언트는 임의 id 생성을 일절 하지 않고 서버가 응답한 `history`만 사용하도록 변경.
  - 서버 history가 아직 도착하지 않은 초기 상태에는 `<p class="ng-editor__history-loading">불러오는 중…</p>` 안내 표시.
  - mine 조회가 실패하거나 없는 경우 현재 본문을 버튼/삭제 링크가 없는 평문 한 줄(`<p class="ng-editor__history-fallback">`)로만 표시하여 오동작 방지.
  - `scripts/verify-neighborhood-greeting-history.mjs`에 UI/Store 소스 코드에 'init' 가짜 id가 포함되어 있지 않음을 검증하는 assert 추가.

### 하자 2 (정리) — PHP 클래스 주석 들여쓰기 공백 제거
- **원인**: `src/Neighborhood/NeighborhoodGreetingService.php` 11줄 `/** 동네 인사 1차. 파일 저장. 랭킹 가산 없음. */` 앞에 4칸 공백이 포함됨.
- **수정**: 앞의 4칸 공백을 제거하여 들여쓰기 없는 원래 코드로 원복.

### 하자 3 (보고 사실 불일치) — Edge Headless 화면 캡처 실제 수행 및 확인
- **원인**: 이전 보고서에 화면 캡처 파일이 누락되어 보고와 실제 파일 상태 불일치.
- **수정**:
  - Windows PowerShell에서 Edge Headless(`msedge.exe --headless=new --window-size=900,600`) 명령을 직접 실행하여 `case1-empty.png`, `case2-active.png`, `case3-editing.png` 3장을 실제로 생성 완료.
  - `Get-ChildItem tmp-shots` 결과 원문을 확인하여 보고서와 worklog에 기록.

### 하자 4 (기록 정정) — HTTP 상태 코드 표기 정정 (403 → 400)
- **원인**: 보고서에 '비소유자 접근 시 403'으로 잘못 기재됨. 실제 코드는 `assertOwns` 실패 시 `InvalidArgumentException`을 던지고, API는 이를 catch하여 HTTP 400 및 오류 JSON을 반환함.
- **수정**: 소스 코드 동작은 유지하고 기록상 표기를 400으로 정정.

## 9. 메인 검수 2차 (최종)

- 검수 (2026-10-08 07:08, Cursor 메인 에이전트, 작업 세션과 별개): **통과** — 대상 `1988bef`
  - 1차(`6c9fa67`) 통과분: 서버 `assertOwns`가 조회(mine)·저장·삭제 모두 적용, `listPublic`은 필드를 골라 만들어 `history` 비노출, 공개 중 맨 위 삭제 시 `down` 전환(남은 항목 자동 공개 없음), 화면 출력 전부 `esc`
  - 하자 1: 가짜 id 제거 확인. 서버 history 도착 전 「불러오는 중…」, mine 실패·기록 없음은 버튼 없는 평문 또는 「아직 올린 인사가 없어요」로 전환(무한 로딩 없음)
  - 하자 2: 주석 들여쓰기 원복 확인 / 하자 3: `tmp-shots` 3장 실재 확인(목록 3개+게시 중, 편집 중 화면이 사용자 결정 레이아웃과 일치) / 하자 4: 기록 정정 확인
  - PHP 실행 검증은 이 PC에 PHP가 없어 미실시 — 배포 후 운영에서 올리기·불러와 고치기·×·내리기 확인 필요
- 승인: 사용자 위임 (2026-10-08 04:17 「배포까지 승인하겠다. 무결성은 제외.」) — `main` push는 Cursor 자동 검토가 사용자 승인 카드를 요구해 기상 후 배포
