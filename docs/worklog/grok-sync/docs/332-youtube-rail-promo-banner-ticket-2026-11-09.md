# 332 · 우측 레일 상단 유튜브 홍보배너 2슬롯 — Cursor 지시서 (보안 근거)

> 작성 2026-11-09 (KST) · 우동공과3 · 상태: **Cursor 실행 대기** · 확정: 종현 2026-11-04 · 2026-11-09(t1114~t1116)
> 기준 main `d1173bb3` (PR #135) · 다음 단계: 이 티켓 → 운영 CSP 스모크(331 §9-2) → **후속 B**

**붙여넣기 규칙: 「이 md만 읽고, 범위(in) 파일 밖 수정 금지. 레포 전역 검색으로 범위 넓히기 금지. 발견 이슈는 메모만.」**

---

## 1. 목표

우측 레일 **맨 위(「이달의 베스트」보다 위)** 에 유튜브 홍보영상 썸네일 2슬롯을 단다.
- 슬롯 A: **공부방 홍보영상** · 슬롯 B: **과외쌤 홍보영상**
- 썸네일 클릭 → **본문 칼럼 중앙** 팝업(약 560×360)에서 재생.

시안(참고만): `332-assets/rail-promo-mockup.jpg` · `332-assets/popup-mockup.jpg`

## 2. 노출 규칙 (잠금)

| 사용자 | 노출 |
|--------|------|
| 게스트 · 이메일 미인증(레일상 guest) | A + B |
| 학생(parent) | A + B |
| 공부방(study_room) | A만 |
| 과외쌤(tutor) | B만 |
| 관리자 | A + B (게스트와 동일 — 미리보기 확인용) |

- 판정: 레일 ctx의 `navRole`(기존 `resolveNavRole`) 사용. `study_room`→A, `tutor`→B, **그 외 전부 A+B**.
- 노출 화면: **full 톤 사이드바 레일만** — `home_right_rail`(홈·`#/guest` 포함) · `search_right_rail`.
- 조건식(고정): `slotKey ∈ {home_right_rail, search_right_rail}` **AND** `tone === 'full'` **AND** `variant === 'sidebar'`.
- 미노출: entry/quiet 레일 전부(마이페이지·등록·고객센터·이용안내·정책·고민방·**홍보 진입 `promo/shell.js`(entry)**·plans), 상세(`renderRightRailBlock` inline), 관리자 화면.
- 영상 ID가 비었거나 형식 불일치 → **슬롯 자체를 렌더하지 않음**(빈 자리·플레이스홀더 금지). 둘 다 없으면 블록 전체 없음.

## 3. 범위(in) — 손댈 파일만

| # | 파일 | 할 일 |
|---|------|------|
| 1 | `preview/home-ui/src/promo-video-config.js` **(신규)** | 상수만: `PROMO_VIDEOS = { study_room: { id: '', title: '공부방 홍보영상' }, tutor: { id: '', title: '과외쌤 홍보영상' } }` · `isValidYoutubeId(id)` = `/^[A-Za-z0-9_-]{11}$/` |
| 2 | `preview/home-ui/src/right-rail.js` | ① `renderRailLayers()`(L244~) full 분기 맨 앞에 `renderPromoVideoSlot(slotKey, ctx)` 삽입 — 조건은 §2. `renderPromoWithRightRail()`(L203)에서 `variant`를 ctx로 넘김 ② `bindRightRailEvents()`(L883~920) 재생 로직 교체(§4) ③ 기존 `esc()`(L256)만 사용 |
| 3 | `preview/home-ui/src/styles/home-right-rail.css` | `.live-rail-promo-video*` 슬롯 스타일 · 기존 `.live-rail-media-dialog*`(L437~500) 크기·위치 조정 · 모바일(≤1023) |
| — | `preview/shared/promo-links.js` | **읽기 전용 import** — `extractYoutubeVideoId`(L141). 수정 금지 |
| — | `preview/shared/draggable-dialog.js` | **읽기 전용 import** — `bindDraggableDialog`. 수정 금지 |

호출부(`home-ui/src/layout.js` L389·L456, `search-ui/src/layout.js` L64·L100·L147)는 **수정하지 않는다**. 이미 `renderPromoWithRightRail` / `bindRightRailEvents`를 거치므로 위 3파일로 끝나야 한다. 끝나지 않으면 **멈추고 보고**.

## 4. 필수 작업

1. **슬롯 마크업**: `<button type="button" data-rail-media-open data-rail-media-key="study_room|tutor">` 안에 썸네일 `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${esc(title)}" loading="lazy" decoding="async">` + 재생 아이콘 + 제목. 영상 ID를 `data-*` 속성에 **넣지 않는다**(키만 넣고 클릭 때 config에서 다시 읽음).
2. **클릭 → 재생**: 키로 `PROMO_VIDEOS[key].id` 조회 → `isValidYoutubeId` 재검사 → 실패면 **열지 않음**(콘솔 경고 1줄). 기존 `src.split('/').pop()` / `[?&]v=` 추출 코드는 **삭제**. 다른 레일에서 `data-rail-media-src`가 쓰일 경우 그 경로도 `extractYoutubeVideoId()` + 11자 검사로만 통과.
3. **iframe은 클릭 때 DOM API로 생성**(`document.createElement`, innerHTML 금지):
   - `src = https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` (autoplay 금지)
   - `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"` — scripts/same-origin: 플레이어 동작 필수 · presentation: 전체화면/캐스트 · popups: 「YouTube에서 보기」 새 탭. **top-navigation·forms 불허**(우리 페이지 이동 차단)
   - `referrerpolicy="strict-origin-when-cross-origin"` · `allow="encrypted-media; picture-in-picture; fullscreen"` · `allowfullscreen` · `loading="lazy"` · `title`=config 제목(textContent/속성 대입)
   - **clipboard-write·gyroscope·accelerometer·autoplay 제거**
4. **팝업**: 기존 `.live-rail-media-dialog` 패턴 재사용. 다이얼로그는 처음 열 때 `document.body`에 1개 생성(레일 아코디언 패널 안에 두지 않음 — 모바일 접힘에 가려짐 방지). `role="dialog"` `aria-modal="true"` `aria-labelledby`=제목.
   - 위치: **본문 칼럼(`.home-main` / 찾기 본문 칼럼) 가로 중앙** — 열 때 그 요소 `getBoundingClientRect()` 중앙 기준. 칼럼 못 찾으면 뷰포트 중앙.
   - 크기: 프레임 `width: min(560px, 100vw - 32px)` · 16:9(`aspect-ratio: 16/9`, 560 기준 약 315 + 제목줄 ≈ 360) · **가로 스크롤 0**.
   - 제목줄 드래그: `bindDraggableDialog(panel, titleBar)` (데스크톱만, 모듈 규칙 그대로).
   - 닫기: 닫기 버튼 · **Esc** · 바깥(backdrop) 클릭. 닫을 때 **iframe 제거**(재생 중지) · 리스너 해제 · 포커스를 연 버튼으로 복귀 · `body.is-rail-media-open` 해제.
5. **모바일**: 레일 기존 아코디언(≤1023) 그대로 따른다. 슬롯은 패널 맨 위. 390폭에서 썸네일 2개 세로 스택, 팝업 가로 스크롤 없음.

## 5. 보안 요구 (근거 포함)

| # | 요구 | 근거 |
|---|------|------|
| S1 | **CSP·Cloudflare 헤더·`.htaccess` 변경 금지.** 운영 CSP(Enforce)는 이미 `frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com …` · `img-src https:` 허용 → nocookie embed·i.ytimg 썸네일로 충분 | `docs/worklog/2026/11/2026-11-09-82-fix6-csp-report-only.md` · `-82-fix6b-csp-enforce.md` · 331 §9-2 |
| S2 | **YouTube IFrame API 스크립트 금지**(`script-src`에 youtube 없음). 순수 `<iframe>`만 | 위 동일 · 331 §9-1(unsafe-inline 후순위 — 새 인라인 스크립트도 금지) |
| S3 | 영상 ID는 **config 상수에서만**. URL hash/query·사용자 입력·DB·API·`data-*` 금지. 렌더 전·재생 전 **2회** `/^[A-Za-z0-9_-]{11}$/` | 82j XSS 정리 · 329 조치(인젝션 차단) |
| S4 | 기존 `bindRightRailEvents`의 위험 추출(`src.split('/').pop()`) 제거 → `extractYoutubeVideoId` + 11자 검사, 불일치 시 열지 않음 | 현 코드 `right-rail.js` L906 |
| S5 | 문자열 삽입은 기존 `esc()` 또는 DOM 속성 대입만. 미이스케이프 `innerHTML` 금지 | 82j |
| S6 | iframe `sandbox`·`referrerpolicy`·`allow` 최소권한(§4-3). autoplay 금지 · 클릭 때만 생성 · 닫으면 제거 | 81 잠금 취지(외부 유입 대비 최소 노출) |
| S7 | **새 의존성·새 외부 origin·쿠키·localStorage·추적/분석 코드 금지**(youtube-nocookie·i.ytimg 외 없음) | 81 · 331 |
| S8 | 역할별 노출은 **화면 표시용일 뿐 인가 경계가 아님**(영상은 공개물). 서버·API 변경 없음 | 330 navRole 정책 |

## 6. 범위(out) — 손대지 않음

- `src/**`(PHP) · `sql/**` · `api/**` · 관리자 UI(`preview/home-ui/src/admin/**`) · 영상 ID 관리 화면·DB 저장(이번 아님)
- CSP · Cloudflare · `.htaccess` · `.github/workflows/**` · `package.json`/lock
- `preview/home-ui/src/mypage/**` · `layout.js`(home/search) · `promo/shell.js` · `right-rail-store.js` · `board-channel-acl.js` · `rail-popup.js` · 다른 레일·상세 레일
- `preview/shared/**` 수정 일체(읽기 import만)
- 잠금 준수: 마이페이지 안 이벤트 외부 이탈 금지(t877) · PG HOLD · 호스팅 변경 금지 · 가격 표기 잠금 · 마이페이지 첫 화면=내 등록(B 잠금) · 암호화 12/1 전 보류
- 「관련 정리」·리팩터·drive-by 금지

## 7. 수락 기준

- [ ] `git diff --stat` = §3 의 3파일만(신규 config 포함)
- [ ] 테스트용 임시 ID로 확인 후 **커밋 시 config ID는 빈 문자열 `''`**(종현이 실제 ID 주면 별도 커밋) — 빈 값이면 슬롯 없음 확인
- [ ] 잘못된 ID(예: `abc`, `<script>`, 12자) → 슬롯 숨김 · 강제 클릭 경로도 열리지 않음
- [ ] 스크린샷: guest / student / room / tutor × home / search × 1280 / 1023 / 390 (24장) — 노출 규칙 §2 일치
- [ ] entry/quiet 레일(마이·등록·고객센터·이용안내·홍보 진입)·상세·관리자에 슬롯 **없음** (각 1장)
- [ ] 팝업: 본문 칼럼 중앙 · 제목줄 드래그 · Esc · 바깥 클릭 · 닫기 → DevTools에서 iframe 사라짐 확인
- [ ] iframe 속성 스냅샷(sandbox·referrerpolicy·allow·src=nocookie·autoplay 없음)
- [ ] `npm run build`(home-ui·search-ui) 통과
- [ ] **배포 후 운영(https://study114.net)**: 홈·찾기에서 1회 재생 · 콘솔 **CSP 위반 0건**(331 §9-2) — 이 단계는 실제 ID 들어간 뒤 수행

## 8. 진행·배포

- `D:\work\study114` 에서 워크트리 `D:\work\study114\.wt\yt-rail-promo` · 브랜치 `work/332-yt-rail-promo` (origin/main 기준)
- 커밋 → push → **PR to main까지만**. **머지·배포는 우동공과3 검수 통과 후**
- 스크린샷·증거는 `tmp/332-evidence/`(커밋 제외)

## 9. 완료 보고 형식

```
332 완료 보고
- 브랜치/커밋/PR:
- 변경 파일(diff --stat):
- 노출 규칙 확인표(역할×화면):
- 보안 S1~S8 각 OK/근거(코드 위치):
- 스크린샷 경로:
- iframe 속성 스냅샷:
- 빌드 결과:
- (배포 후) 운영 CSP 콘솔 결과:
- 범위 밖 발견(메모만):
```

## 10. 다음 (이 티켓 뒤)

1. 종현이 실제 영상 ID 2개 전달 → config 1줄 커밋 → 배포 → 운영 CSP 스모크(331 §9-2)
2. **후속 B**: 일회용 계정 2개(공급자×2 또는 학생+공급자)로 IDOR 교차 재점검 (331 §9-3 · admin·실유저 계정 외부 제공 금지)
3. CSP `'unsafe-inline'` 제거(후순위, 331 §9-1)

## 근거 문서

`docs/internal/81-youtube-pre-security-lock.md` · grok-sync `328` · `329` · `331`(§9-1~9-3) · `docs/worklog/2026/11/2026-11-09-82-fix6-csp-report-only.md` · `2026-11-09-82-fix6b-csp-enforce.md` · `docs/internal/82j-external-retest-consolidation-2026-11-09.md` · `330`(navRole) · 레일 노출표 `docs/design/home-banner-rail-2026-10-14/219-rail-exposure-briefing.md`
