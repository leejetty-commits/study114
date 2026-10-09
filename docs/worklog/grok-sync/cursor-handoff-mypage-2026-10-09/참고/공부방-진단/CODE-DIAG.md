# 공부방 마이페이지 디자인 불일치 코드 진단 (진단만 함)

- 작성: 2026-10-09 (KST) · Grok Bot 실행 에이전트
- 대상 코드: `study114` **origin/main `0d125cc`** (`b249ccc`가 포함된 것 확인). `git show`로 읽기만 했고 코드 수정·커밋·푸시·클라우드 에이전트 실행은 없음.
- 기준 문서: `docs/003-global-design-manual.md` (L39 Primary · **L40 색** · **L41 글자 7단계** · **L42 card 12 / ctl 8** · **L43 뱃지 4px, pill 금지** · L44 칩·탭 6 · **L47 역할색은 soft·탭·아이콘·선택선만** · L49 그림자 · **L77 마이페이지는 예외 없음**), `168` 입력 필드 정책(이 페이지들에서는 계정설정 입력칸만 해당), `193` 좌측메뉴(줄 간격 촘촘하게 + 항목 사이 1px 선), 학생 통일 스펙 `/workspace/mypage-design-v2/SPEC.md` v2(아래 **SPEC**).
- 경로 표기: `mp-ops` = `preview/home-ui/src/styles/mypage-ops.css`, `hmf` = `styles/home-member-flows.css`, `hpr` = `styles/home-provider-reviews.css`, `udx` = `styles/udx-std-apply.css`, `ds` = `styles/design-system.css`, `adm` = `styles/home-admin.css`, `s5b` = `styles/student-mypage-stage5b.css`, `scr` = `src/mypage/screens.js`, `msg` = `src/messages/screens.js`, `inbox` = `src/provider-reviews/inbox.js`.
- CSS 불러오는 순서(`src/main.js` L1–40): tokens → home → **hmf** → … adm … → **hpr** → **ds** → … → **mp-ops**(24) → … → **udx**(34) → … → **s5b**(40). 같은 선택자 우선순위면 뒤에 오는 파일이 이긴다. **쪽지·후기함과 구매이력 아래쪽 목록들은 `mp-ops`에 덮어쓰는 규칙이 없어서 옛 `hmf`/`hpr` 스타일(크림색 #eee7dd, pill, 임의 파랑)이 그대로 나온다.** 이번 불일치의 근본 원인이 여기에 있다.
- 판정: **OK** / **어긋남** / **△**(작은 차이 또는 결정 필요). 실제 화면을 띄워 보지는 않았고 코드 기준이다. 사용자 스크린샷과 맞춰 본 항목은 「스샷 일치」로 표시했다.

---

## 0. 요약: 가장 큰 문제

**구매이력** (`scr` L761–819 `renderPlans`)
1. 섹션 3개가 서로 다른 틀을 쓴다. 「이용중인 노출광고」「쪽지 사용한 대상」은 `mypage-panel--bare` 안에서 **카드 없이 회색 바탕 위에 맨글자**로 나오고, 「결제 내역」만 **제목은 카드 밖, 표는 흰 카드(`mypage-history-box`) 안**에 있다. 같은 등급 제목인데 태그도 **h3 / h3 / h2**로 섞여 있다. (스샷 일치)
2. 제목 위아래 간격이 제각각이다. 제목→내용은 8 / 8 / 13.6px, 앞 섹션→제목은 0 / 16~20 / 24px. 원인은 `hmf` L882의 margin 16/8, `mp-ops` L259·L263의 개별 덮어쓰기, 부모 flex gap 24(`mp-ops` L378)가 섞인 것이다. (스샷 일치)
3. 안쪽 항목 카드(`plans-exposure-item`, `memo-used-item`)는 테두리가 **#eee7dd**(옛 크림 테마, 토큰 아님)이다(`hmf` L790·L798). 「쪽지상세」 버튼은 **뱃지 모양 링크**(`mypage-badge--action`, #dbeafe/#1d4ed8, 높이 20)다.
4. 빈 상태 문구가 세 가지 다른 모양으로 나온다. 맨글자 p 14(「쪽지를 사용한 대상이 없습니다.」), 표 칸(「결제 내역이 없습니다.」), 상태 문장(「베이직 노출 이용중 - 무료광고」). 다른 메뉴가 쓰는 공용 `state-card`는 쓰지 않는다.
5. 좌측 메뉴 아이콘이 `'◌'`(U+25CC, **점선 원** 문자)이다(`src/mypage/router.js` L86). 「빈 점선 동그라미」로 보이는 원인이 이것이다. (스샷 일치)

**쪽지·후기함** (`msg` L111–183, `inbox` L131–180)
1. 마이페이지 공통 스타일을 하나도 받지 않는다. 행(`msg-row`)은 **흰 바탕이 없는 테두리 상자**(투명, r8, `hmf` L2248)라서 회색 바탕이 비쳐 보이고, 섹션 카드도 없다.
2. 하위 탭(쪽지/후기함, `hpr` L146–151)은 활성색 **#1d4ed8 / 밑줄 #2563eb**(임의 hex, 역할색 #266BC4 아님), 굵기 600 고정, 패딩 8.8/14.4, 아래 여백 12다. SPEC 탭 규격(14/500, 활성 700, 역할색 2px, 패딩 12/16, 아래 24)과 다르다.
3. 글자 크기가 7단계를 벗어난다. 「안읽음」 뱃지 **10.4px + pill 999**(`hmf` L2254–2261), 후기함 태그 **pill 999**(`hpr` L123–131), 후기 카드 r9.6이 그렇다.
4. 빈 상태가 맨글자 p다(`<p class="msg-empty-plain">쪽지가 없습니다</p>`, 마침표도 없음). `empty-state-copy.js` L127에 `messages` 문구가 있는데 쓰지 않는다. 공급자 후기함의 빈 문구는 「**작성한** 후기가 없습니다.」인데, 공부방은 후기를 **받는** 쪽이라 뜻이 어긋난다(문구 변경은 종현 승인 필요).
5. 행을 펼치면(`/mypage/messages/thread/{id}`) 페이지 제목이 「쪽지·후기함」에서 **「대화방」**으로 바뀐다(`messages/router.js` L72·L82). 경로 표시줄은 그대로라 제목만 흔들린다.

**셸·좌측 메뉴(공부방 전체)**
- 「찜한 공부방·과외쌤」이 두 줄로 꺾인다. 사이드바 160px − 안쪽 여백 24 − 링크 패딩 17.6 − 테두리 2 − 아이콘 칸 20 − 간격 8 = **글자 칸 약 88px**인데, 이 라벨은 14px에서 **약 135px**가 필요하다(`mp-ops` L37·L52·L120–130). (스샷 일치)
- 학생 쪽은 이미 고친 셸 규칙이 공부방에는 아직 없다. 경로 표시줄 색 #4B5563, 활성 메뉴 왼쪽 3px 선, 아이콘 역할색은 `s5b` L27–47에 **학생 전용**으로만 들어가 있다. 공부방은 경로 표시줄 #6b7280, 3px 선 없음, 아이콘은 회색 opacity .85다.
- 페이지 제목 28과 내 공지 soft 머리는 **이미 전 역할에 적용**되어 있다(`mp-ops` L19·L211–218·L1716–1729). OK.

---

## 1. 공통 셸 (8개 페이지 전부: `src/mypage/shell.js` L109–137)

| 항목 | 현재값 (file:line) | 기준 (SPEC/003) | 판정 |
|---|---|---|---|
| 셸 사용 여부 | 8개 메뉴 모두 `renderMypageShell` → 경로 표시줄 + h1 + 내 공지 + 본문 (`shell.js` L128–135, `mypage/index.js` L72–74) | SPEC §2-1 골격 | OK |
| 페이지 제목 크기 | `--mp-title: 28px` (`mp-ops` L19), `.mypage-content__title` 28/700 (`mp-ops` L211–218). `udx` L419–422가 `--fs-6`(28)으로 다시 지정, 모바일 22 (`mp-ops` L650–659, tokens L195) | 28/700 전 역할 (SPEC C1) | OK |
| 제목 행간 | `mp-ops` L216 `2rem`을 `udx` L421 `--leading-tight`(1.25)가 덮어씀 | 1.3 (SPEC §2-1) | △ (차이 1.25 vs 1.3) |
| 제목 영역 아래 | 1px `--mp-line`(#E5E7EB), 아래 패딩 16, 아래 여백 24 (`mp-ops` L202–209) | 1px #E5E7EB · 16 · 24 | OK |
| 경로 표시줄 | 12px, 색 `--mp-muted` = `--product-muted` **#6b7280** (`mp-ops` L13·L220–223), 구분자 #cbd5e1 (L229–231) | 12/400 **#4B5563** (SPEC §2-2, 003 L40 Muted) | **어긋남** (학생만 `s5b` L27–30으로 고쳐져 있음) |
| 내 공지 머리 | 바탕 #eef4fb, 글자 #266bc4, 14/700, 「더 보기」 12/600 (`mp-ops` L1716–1736) | soft #EEF4FB/#266BC4 전 역할 (SPEC B1) | OK |
| 내 공지 카드 | r12, 아래 2px `--gray-300`, 뱃지 12/r4/h20 (`mp-ops` L1708–1764) | r12 · 아래 2px #CBD5E1 · 뱃지 12/r4 | OK |
| 내 공지 아래 여백 | `margin: 0 0 var(--space-4, 16px)` (`mp-ops` L1709) | **24** (SPEC §2-1 3) | **어긋남** (전 역할) |
| 본문 폭 | `.mypage-content`에 max-width 없음 → 콘텐츠 열 100% (`hmf` L735, `udx` L381–395) | 폭 100% | OK (쪽지 옛 `msg-layout` 42rem은 마이페이지 안에서 안 씀) |
| 공통 muted 토큰 | `--mp-muted` #6b7280 (`mp-ops` L13), 옛 `hmf`는 `--gray-500` #6b7280 / `--gray-600` #4b5563가 섞여 있음 | Muted #4B5563 (003 L40) | **어긋남** (전 역할 토큰) |

## 2. 좌측 메뉴 (공부방)

| 항목 | 현재값 (file:line) | 기준 | 판정 |
|---|---|---|---|
| 메뉴 순서 | 내 등록 · 쪽지·후기함 · 최근열람 · 관심 학생 · 찜한 공부방·과외쌤 · 내 문의 내역 · 구매이력 · 계정설정 (`router.js` L62–92) | 요청과 같음 | OK |
| 「마이페이지」 제목 | 18/700 (`mp-ops` L69–75, `ds` L560의 22를 덮어씀) | 18/700 | OK |
| 사이드바 폭 | `grid-template-columns: 10rem` = 160 (`mp-ops` L37), 패딩 16/12 (L52) | 160 (SPEC 6-B-1 미결: Stage5B는 220) | △ |
| 항목 글자 | 14/500, 색 **#475569**(하드코딩) (`mp-ops` L130–132) | 14/500 #4B5563 | △ (hex 다름) |
| 「찜한 공부방·과외쌤」 줄바꿈 | 글자 칸 ≈ 160 − 24 − 17.6 − 2 − 20 − 8 = **88px**, 라벨 너비 ≈ **135px** → 2줄 (`mp-ops` L37·L52·L120–130). 1023px 이하는 칸이 `minmax(9rem)`(144)이라 그때도 꺾임 (`mp-ops` L639–643) | 한 줄 (193 「줄 간격 촘촘하게」 의도) | **어긋남** (스샷 일치) |
| 강조 굵기 | `is-emphasis`(공부방: 내 등록·관심 학생·구매이력) 600, 활성도 600 (`mp-ops` L156–166, `router.js` L68·L78·L88) → 비활성 항목끼리 굵기가 다르고 활성 항목은 굵기로 구분되지 않음 | 14/500, 활성 700 (SPEC §2-2) | **어긋남** |
| 활성 표시 | soft 바탕 `--brand-blue-light` **#eaf2fc** + #266BC4 글자, 왼쪽 3px 없음 (`mp-ops` L156–162) | soft 바탕 + **왼쪽 3px 역할색** (SPEC §2-2) | **어긋남** (학생은 `s5b` L38–42에서 3px 적용됨) |
| 항목 사이 선 | 1px `--mp-line` (`mp-ops` L139–148) | 193 | OK |
| 아이콘 | 글자 기호 ✎ ✉ ◷ ☆ ♡ ▤ **◌** ⚙ (`router.js` L66–91). 14px, opacity .85, 글자색 따라감 (`mp-ops` L168–172) | 아이콘 = 역할색 허용 (003 L47). 기호 굵기·크기 통일 | **어긋남**. 구매이력 `'◌'`(U+25CC 점선 원)은 빈 동그라미로 보임(스샷 일치). ✉·⚙는 OS에 따라 컬러 이모지로 그려질 수 있음 |

---

## 3. 페이지별 진단

### 3-1. 내 등록 (`/mypage/registrations/study-rooms/{id}`): `src/study-room-reg/screens.js`

> 4탭 안쪽은 SPEC C4에 따라 **이번 범위 밖**. 셸·탭 수준만 기록한다.

| 항목 | 현재값 (file:line) | 기준 | 판정 |
|---|---|---|---|
| 페이지 제목 | **공부방 이름**(동적) (`mypage/router.js` L213–217). 경로 표시줄은 「마이페이지 - 내 등록」 | 28. 문구 규칙은 별도 | △ (제목 문구가 메뉴명과 다름: 의도된 동작인지 확인 필요) |
| 틀 | `mypage-panel mp-room-panel`(테두리 없음) > `.mp-room`(gap **20**) > 탭 헤더 > 본문 (`screens.js` L108–116, `mp-ops` L243–249·L1208–1212) | 탭 아래 24 | △ |
| 탭 | 14/500, 패딩 10.4/13.6, 활성 700 **글자 ink** + 2px `--mp-accent`(#266BC4 = 공부방 역할색) (`mp-ops` L1268–1300) | 14/500, 활성 700 + 역할색 2px, 패딩 12/16 (SPEC B2) | △ (밑줄 OK. 글자색·패딩 다름. 학생은 `s5b` L55–71) |
| 좁은 화면 탭 | ≤720px에서 `font-size: 0.8125rem` = **13px** (`mp-ops` L1633–1636) | 7단계 (003 L41) | **어긋남** |
| 안쪽 하드코딩 | `mp-room__shop-nudge` #fff7ed/#9a3412, 14.4px, 굵기 650 (`mp-ops` L1540–1561), `__checklist--shop` 그라데이션 (L1478–1486) | 003 L41·T67 | 범위 밖 (기록만) |

### 3-2. 쪽지·후기함 (`/mypage/messages`, `/mypage/messages/reviews`): `msg` · `inbox`

| 항목 | 현재값 (file:line) | 기준 | 판정 |
|---|---|---|---|
| 셸 | 공통 셸 사용. 제목 「쪽지·후기함」 (`mypage/router.js` L230–233, `messages/router.js` L79–89) | 28 | OK |
| 펼침 시 제목 | `/thread/{id}`에서 제목이 **「대화방」**으로 바뀜 (`messages/router.js` L72·L82). 경로 표시줄은 그대로 | 메뉴를 옮기지 않으면 제목 고정 | **어긋남** |
| 하위 탭 바 | `.msg-hub` 아래 1px `--gray-200`, **아래 여백 12** (`hpr` L146) | 아래 24 (SPEC §2-1 4) | **어긋남** |
| 하위 탭 글자 | 14/**600** 고정, `--gray-600`, 패딩 8.8/14.4 (`hpr` L147–150) | 14/500, 패딩 12/16 | **어긋남** |
| 하위 탭 활성 | 글자 **#1d4ed8**, 밑줄 **#2563eb** 2px (`hpr` L151), 굵기 변화 없음 | 700 + 역할색(#266BC4) 2px (SPEC B2, 003 L47) | **어긋남** (임의 hex) |
| 섹션 카드 | 없음. `msg-hub` + `.msg-list`가 셸 본문에 바로 붙음 (`msg` L150–152) | 흰 섹션 카드 안 행 (SPEC §2-3) | **어긋남** |
| 목록 행 | `.msg-row`: 테두리 1px `--gray-200`, **r8**, 패딩 12, **바탕 없음(투명)**, 행 사이 8 (`hmf` L2245·L2248) | 카드 안 「행 + 1px 구분선」 또는 흰 카드 r12 (003 L42, SPEC §2-3-2) | **어긋남** |
| 행 상태색 | 안 읽음 #eaf2fc/#bfdbfe, 중요 **#fffbeb/#f2d187**(노랑), 펼침 #93c5fd (`hmf` L2249–2251). 별 #d1d5db/#eab308 (L2271–2275), 점 #2563eb (L2284) | 팔레트 토큰 (003 L40) | **어긋남** (하드코딩, 노랑은 팔레트 밖) |
| 행 글자 | 이름 14/600, 제목 16/700(body 상속), 시간 12 (`hmf` L2252–2287) | 7단계 안 | OK |
| 「안읽음」/「상대 안읽음」 뱃지 | **10.4px**(0.65rem), **pill 999** (`hmf` L2254–2263). udx 뱃지 통일 대상에서 빠짐 | 12 · r4 (003 L41·L43) | **어긋남** |
| 맥락 칩·범위 뱃지 | `msg-chip`·`msg-badge`를 `udx` L163–189가 12/r4/h20으로 통일. 색 #e0f2fe/#0369a1 (`hmf` L2291) | r4 OK. 색은 팔레트 밖 | △ |
| 펼친 본문 | `msg-scope` #f0f9ff (`hmf` L2299), 경고 `msg-note--warn` (L2294), 버튼 Secondary sm 3개 + 「전송」 Primary sm (`msg` L229·L248–252) | Primary는 대표 CTA만 | △ |
| 빈 상태 (쪽지) | `<p class="msg-empty-plain">쪽지가 없습니다</p>` 14, `--gray-600`, 위 여백 16, 마침표 없음 (`msg` L133–136, `hmf` L806–810). `empty-state-copy.js` L127 `messages` 문구 미사용 | 다른 메뉴처럼 `state-card` (최근열람·찜·문의) | **어긋남** |
| 후기함 틀 | `section.review-inbox`에 대응 CSS 없음 → 맨바닥. 목록 `.review-sheet__list` gap 10.4 (`inbox` L131–136·L167–175, `hpr` L110) | 섹션 카드 | **어긋남** |
| 후기 항목 | `.review-sheet__item` 흰 바탕, 1px `--gray-200`, **r9.6**(0.6rem), 패딩 12.8 (`hpr` L111–112). 제목 14/600 `--gray-800`, 날짜 12 (L113–114) | r12 (003 L42) | **어긋남** |
| 후기 태그 | `.review-inbox__tag` 12/600, #eef4ff/#1e3a5f, **pill 999** (`hpr` L123–131) | 뱃지 r4 (003 L43) | **어긋남** |
| 후기 빈 상태 | `p.review-sheet__empty` 14 「작성한 후기가 없습니다.」 + `p.review-inbox__lead` 14 「쪽지 상담 후에 후기를 남기면 여기에 모입니다.」 (`inbox` L179–180, `provider-reviews/copy.js` L91–92) | `state-card` · 공급자에게 맞는 문구 | **어긋남** (모양) + △ (문구 뜻: 공부방은 받는 쪽. 종현 승인 필요) |
| 페이지 넘김 | 맨글자 「이전 · n / m · 다음」 14 (`hpr` L133) | — | △ |
| 학생 노출 | `renderMessagesHub`가 역할을 가리지 않고 렌더됨 (`msg` L135·L151) → **학생에게도 쪽지/후기함 탭이 보인다** | SPEC 6-B-3 미결 | 코드상 답: 보인다 |

### 3-3. 최근열람 (`/mypage/recent`): `scr` L470–511

| 항목 | 현재값 | 기준 | 판정 |
|---|---|---|---|
| 셸 | 공통. 제목 「최근열람」 | 28 | OK |
| 섹션 카드 | 없음. `mypage-panel--bare` (`scr` L474·L482, `mp-ops` L251–257) | 흰 섹션 카드 1장 안 행 (SPEC §3 #3) | **어긋남** |
| 목록 | 항목마다 개별 카드 `.mypage-entity`: r12, 1px #E5E7EB, 패딩 13.6/16, 최소 높이 56, 사이 8 (`mp-ops` L312–319, `hmf` L883–888) | 카드 안 「행 + 1px」 | **어긋남** (구조) |
| 글자 | 이름 strong 16, 메타 `mypage-muted` 14 (#6b7280) | 값 16 · 보조 14 #4B5563 | △ (색) |
| 버튼 | 「다시 보기」 Secondary sm h40 | OK | OK |
| 빈 상태 | `state-card` (r12, 패딩 20, 제목 16/600, 본문 14, 20px 표시 상자) (`empty-state-copy.js` L121–126·L400–430, `udx` L277–286·L347–361) | 공용 빈 상태 | OK (이 화면군의 기준으로 삼을 만함) |

### 3-4. 관심 학생 (`/mypage/student-review`): `scr` L409–468

| 항목 | 현재값 | 기준 | 판정 |
|---|---|---|---|
| 셸 | 공통. 제목 「관심 학생」 | 28 | OK |
| 섹션 카드 | 없음 (`mypage-panel--bare`, `scr` L429·L436) | 섹션 카드 | **어긋남** |
| 목록 | `.mypage-entity` 개별 카드 + 버튼 3개(상세·쪽지·빼기) Secondary sm (`scr` L438–466) | 카드 안 행 | **어긋남** (최근열람과 같은 패턴) |
| 뱃지 | `mypage-badge` 12/600 r4 h20 (`mp-ops` L361–368, `udx` L163–189) | r4 | OK |
| 딥링크 배너 | `.handoff-deeplink-banner` #eff6ff/#bfdbfe/#1e40af, r8 (`hmf` L824–828) | 토큰 | △ |
| 빈 상태 | `state-card` 「검토 중인 학생이 없습니다」 (`empty-state-copy.js` L145–150) | 공용 | OK |

### 3-5. 찜한 공부방·과외쌤 (`/mypage/wishlist`): `scr` L332–407

| 항목 | 현재값 | 기준 | 판정 |
|---|---|---|---|
| 셸 | 공통. 제목 「찜한 공부방·과외쌤」 (`router.js` L246) | 28 | OK |
| 틀 | 흰 `.mypage-panel` 1장: r12, 1px, **패딩 16/20** (`mp-ops` L234–240) | 패딩 24 (SPEC §2-2) | **어긋남** |
| 소제목 | `h2.mypage-subhead` 「공부방」「과외쌤」 18/700, margin 16/8 (`mp-ops` L283–289, `hmf` L882) | 섹션 카드 제목 18/700 = 카드 2장 (SPEC §3 #2) | **어긋남** (카드 1장 안 소제목 2개) |
| 목록 | 항목 = `expo-basic` 카드(+`mypage-wish-card__foot`), 패널 안 카드 (`scr` L298–349) | 카드 안 카드 금지 (SPEC §2-3-2) | **어긋남** |
| 빈 상태 | `state-card`가 **흰 패널 안에** 들어감 → 카드 안 카드 (`scr` L334–344) | — | **어긋남** |
| 안내 | `mypage-note` 14 (`scr` L401) | 14 | OK |

### 3-6. 내 문의 내역 (`/mypage/contact`): `scr` L543–648, `mp-ops` L675–884

| 항목 | 현재값 | 기준 | 판정 |
|---|---|---|---|
| 셸 | 공통 | 28 | OK |
| 섹션 카드 | 없음 (`mypage-panel--bare`, `scr` L559·L567·L642) | 섹션 카드 | **어긋남** |
| 머리줄 | 안내 14 + 「새 운영문의 남기기」 Secondary sm. 목록 아래에 **같은 버튼이 한 번 더** (`scr` L546–554·L646) | CTA 1번 | △ |
| 목록 | `<details>` 개별 카드 r12, 패딩 13.6/16, 제목 16/600, 메타 12 (`mp-ops` L718–762) | 카드 안 행 | **어긋남** (구조) |
| 상태 뱃지 | r4, 색 하드코딩 #f1f5f9/#475569 · #eff6ff/#1d4ed8 · #ecfdf3/#166534 (`mp-ops` L777–790) | 토큰 | △ |
| 답변 상자 | `--mp-accent-soft` 바탕 r8 (`mp-ops` L822–829) | — | OK |
| 빈 상태 | `state-card` (`scr` L569–571) | 공용 | OK |

### 3-7. 구매이력 (`/mypage/plans`): `scr` L713–819 (★ 스샷 대상)

| 항목 | 현재값 (file:line) | 기준 | 판정 |
|---|---|---|---|
| 셸 | 공통. 제목 「구매이력」 (`router.js` L250) | 28 | OK |
| 전체 틀 | `div.mypage-home`(flex column, **gap 24**) (`scr` L780, `mp-ops` L378–380. `hmf` L897–905 clamp gap을 덮어씀) | 섹션 카드 사이 16 (SPEC §2-1 6) | **어긋남** |
| 섹션1 「이용중인 노출광고」 | `section.mypage-panel.mypage-panel--bare.mypage-usage-overview` → **테두리·바탕·패딩 0** (`scr` L781, `mp-ops` L251–257, `udx` L143–149) | 흰 섹션 카드 r12 패딩 24 | **어긋남** (스샷: 맨글자) |
| 섹션2 「쪽지 사용한 대상」 | 섹션1과 **같은 bare 섹션 안에** h3만 하나 더 (`scr` L789–790) | 별도 섹션 카드 | **어긋남** (스샷: 맨글자) |
| 섹션3 「결제 내역」 | `section.mypage-plans-history`(틀 없음) > **h2는 카드 밖** > `.mypage-history-box`(흰 카드 r12, 1px, 패딩 16/20, overflow-x) > 표 (`scr` L793–817, `mp-ops` L267–273) | 제목도 카드 안, 패딩 24 | **어긋남** (스샷: 이것만 흰 카드) |
| 제목 태그·크기 | h3 / h3 / **h2**, 셋 다 `.mypage-subhead` 18/700, 행간 1.45 (`scr` L783·L789·L794, `mp-ops` L283–289) | 카드 제목 18/700 행간 1.3, 같은 등급 같은 태그 | △ (크기는 OK, 태그·행간 다름) |
| 제목 간격 | 섹션1 제목: 위 0(`mp-ops` L259–261, 배너가 있으면 16) / 아래 8(`hmf` L882). 섹션2 제목: 위 16, 앞이 갱신 안내면 20으로 겹침(`hmf` L804) / 아래 8. 섹션3 제목: 위 24(flex gap) / 아래 **13.6**(`mp-ops` L263–265) | 제목 묶음 아래 24, 카드 사이 16 | **어긋남** (스샷 일치) |
| 노출 항목 | `li.plans-exposure-item` 개별 카드: 테두리 **#eee7dd**, r12, 패딩 12/13.6, 글자 14 `--gray-700` **#334155** (`hmf` L795–803). 항목 사이 10.4, 목록 아래 13.6 | Line #E5E7EB, Ink/Muted 토큰 (003 L40) | **어긋남** (크림 hex, 카드 안 카드 될 위험) |
| 갱신 안내 | `.plans-renewal-note` 14 `--gray-600` + 「노출상품 재구매」 Secondary sm, 아래 20 (`hmf` L804–805, `scr` L732–735) | — | △ |
| 쪽지 대상 항목 | `li.memo-used-item` 개별 카드: 테두리 **#eee7dd**, r12, 패딩 10.4/13.6, 바탕 #fff (`hmf` L783–794) | 카드 안 「행 + 1px」 | **어긋남** |
| 「쪽지상세」 동작 | `a.mypage-badge.mypage-badge--action` = 뱃지 모양 링크 #dbeafe/#1d4ed8, h20, 12px (`scr` L754, `hmf` L777–782, `udx` L163–189) | 동작은 Secondary 버튼 또는 글자 링크. 뱃지는 상태 표시 전용 (003 L43·L45) | **어긋남** |
| 결제 표 | `.plans-table` 14, th `--gray-600` 600, td 패딩 8/6.4, 아래 1px #E5E7EB, **표 위아래 margin 8/16** (`adm` L828–844, 관리자 CSS 재사용) → 카드 패딩 16에 margin 16이 더해져 카드 아래 여백 32 | 행 패딩 12, 카드 패딩 24 | **어긋남** |
| 표 머리 | 「상품 · 금액 · 일시 · 상태」, 상태값은 원문 그대로(`r.status`) (`scr` L797·L808) | — | △ (상태값이 영문 코드인지 라이브 확인 필요) |
| 빈 상태 ① | 노출 없음: `p.mypage-muted` 「베이직 노출 이용중 - 무료광고」 14 (`scr` L787, `plans-catalog.js` L190) | 빈 상태가 아니라 상태 표시. 카드 안 행으로 | △ |
| 빈 상태 ② | `p.mypage-muted` 「쪽지를 사용한 대상이 없습니다.」 14 (`scr` L741) | `state-card` 또는 카드 안 빈 줄(통일) | **어긋남** |
| 빈 상태 ③ | `<td colspan=4 class="mypage-muted">결제 내역이 없습니다.</td>` (`scr` L812) | 위와 같은 규칙 | **어긋남** (세 가지 모양) |
| 빈 날짜 | 「구매일 — · 종료일 —」 (`scr` L725), 지역 없음 「미설정」 (`scr` L707·L710) | 공란 「미입력」 (SPEC B3는 학생 마이프로필 범위) | △ (문구 통일은 종현 결정) |
| 공지 배너 | `renderProviderNoticeBanners()` = `mypage-info-box` 흰 카드가 bare 섹션 안에 들어감 (`scr` L782, `provider-notices.js` L40–61) | — | △ (있으면 섹션1 제목 위 여백이 16으로 바뀜) |
| 하위 화면 | `/mypage/plans/my`(제목 「구매이력」), `/mypage/plans/history`(제목 **「구매내역」**), `/mypage/paid*`는 흰 `.mypage-panel` 1장 + 소제목 방식 (`scr` L822–911, `paid-screens.js`, `router.js` L251–252) | 메뉴명 통일 | △ (「구매이력/구매내역」 이름이 섞임) |
| 아이콘 | `'◌'` U+25CC (`router.js` L86) | 의미 있는 기호 | **어긋남** (스샷 일치) |

### 3-8. 계정설정 (`/mypage/account`): `scr` L957–1129, `hmf` L320–466·L631–682

| 항목 | 현재값 | 기준 | 판정 |
|---|---|---|---|
| 셸 | 공통. 제목 「계정설정」 | 28 | OK |
| 히어로 | `account-settings__hero`: r16, 1px #d7e4ff, 그라데이션 + 그림자 + 방사형 장식 (`hmf` L333–355) | 그라데이션·강한 그림자 없음, card 12 (003 L42·L49, T67) | **어긋남** |
| 이름 | `h2.account-settings__name` clamp(20~24px) (`hmf` L366–374) → 페이지 제목 아래 큰 제목이 하나 더 | 7단계, 중간값 금지 (003 L41) | **어긋남** |
| 카드 | `account-card` **r14.4**, 1px #e2e8f0, 그림자, 호버 그림자 (`hmf` L399–411) | 흰 r12 1px #E5E7EB 그림자 없음 | **어긋남** |
| 카드 머리 | 그라데이션 머리띠 + 아래 1px #eef2f7, 패딩 15.2/17.6 (`hmf` L413–417·L449–459) | 카드 안 머리띠 금지 (SPEC §2-3-1) | **어긋남** |
| 카드 제목 | `--account-title` = `--fs-3` **16**, #0f172a (`hmf` L321·L419–424) | 18/700 #1C1917 | **어긋남** |
| 설명·라벨·도움말 | 설명 14, 도움말 12 (`hmf` L322–323·L427–431) | 14 / 12 | OK |
| 입력칸 | `.account-form .form-input` 글자 **14**, 테두리 **#cbd5e1**, **r8.8**, 높이 44(`udx` L230–234 `--input-h`) (`hmf` L631–638) | h44 · 글자 16 · 1px #E5E7EB · r8 (SPEC §2-2, 168 필드 정책) | **어긋남** (글자·테두리·radius) |
| 버튼 | Secondary sm h40, 저장 「표시명 저장」「변경 저장」 Primary sm (`scr` L1017·L1084) | 저장 = Primary h44 | △ |
| 빈 값 | 표시명 없음 「미설정」, 소셜 없음 「없음(이메일 계정)」, 대표 지역 없으면 빈칸 (`scr` L963·L970·L1045) | 「미입력」 (SPEC B3는 학생 마이프로필) | △ (종현 결정) |

---

## 4. Cursor 수정 우선순위

> 원칙: **마크업은 공용 JS 한 곳**(`scr`/`msg`/`inbox`)이고 공부방·과외쌤(·학생) 화면을 같이 그린다. 그래서 「공부방만」은 **CSS 범위 선택자** `.home-app--role-study_room …`로만 가능하다. 구매이력·관심 학생 메뉴는 공부방·과외쌤에게만 보이므로 마크업을 바꾸면 **공급자 공통**이 된다. 쪽지·최근열람·찜·문의·계정설정은 학생도 보므로 마크업을 바꾸면 **전 역할**에 영향이 있다. 학생 2차 티켓(SPEC C2)과 겹친다.
> 금지(SPEC §5와 같음): 라벨·문구·메뉴 순서·라우트·저장 API 변경, push / `build:dothome`. 문구 변경은 종현 승인 후에만.

### P0: 스샷 문제 바로 해결

| # | 할 일 | 파일 | 범위 | SPEC v2와 겹침 |
|---|---|---|---|---|
| P0-1 | **구매이력 3섹션을 같은 섹션 카드로.** `renderPlans`를 `section.mp-card` ×3(이용중인 노출광고 / 쪽지 사용한 대상 / 결제 내역)으로 나누고, 제목은 셋 다 카드 **안** 같은 태그(h2)로 18/700 행간 1.3, 제목 아래 16(목록형), 카드 흰 바탕·1px #E5E7EB·r12·패딩 24, 카드 사이 16. `mypage-panel--bare`와 `mypage-history-box` 겹틀은 없앤다. | `src/mypage/screens.js` L779–818(마크업만), `mypage-ops.css` L259–281 정리 + 새 섹션 카드 규칙 | 공급자 공통(구매이력은 공부방·과외쌤 전용 메뉴) | SPEC §2-1·§2-3 섹션 카드 토큰을 그대로 씀(학생 `s5b` L91–127과 같은 값) |
| P0-2 | **구매이력 안쪽 목록을 「행 + 1px 선」으로.** `plans-exposure-item`·`memo-used-item`의 #eee7dd 개별 카드를 카드 안 행(패딩 12/0, 사이 1px #E5E7EB)으로 바꾸고, 글자 14 #4B5563 / 값 16 #1C1917로 맞춘다. | `mypage-ops.css`(새 덮어쓰기. `hmf` L783–805는 손대지 않고 mp-ops에서 덮음) | 공급자 공통 | SPEC §2-3-2 |
| P0-3 | **「쪽지상세」를 뱃지에서 동작으로.** `mypage-badge--action`을 Secondary sm 버튼 또는 14/600 #266BC4 글자 링크로 바꾼다. | `screens.js` L754(class만), `mypage-ops.css` | 공급자 공통 | SPEC 카드 「수정」 링크(14/600 #266BC4)와 같은 모양 |
| P0-4 | **결제 표 간격.** 마이페이지 안 `.plans-table`은 margin 0, td/th 패딩 12/8, 머리 12~14/600 #4B5563. | `mypage-ops.css`(`.mypage-layout .plans-table`로 범위를 잡음. `home-admin.css` L828은 관리자도 쓰므로 수정 금지) | 공급자 공통 | — |
| P0-5 | **구매이력 아이콘 `'◌'` 교체.** 다른 기호(예: 영수증·카드 모양)로 바꾸고, 아이콘 전체를 같은 굵기의 SVG 세트로 통일하는 방안도 검토. | `src/mypage/router.js` L86 | 전 역할 공통 데이터(메뉴는 공급자에게만 보임) | 학생 아이콘 역할색(`s5b` L44–47)과 같이 정리 |
| P0-6 | **「찜한 공부방·과외쌤」 한 줄로.** 방법 A: 사이드바 160→**208~220**(SPEC 6-B-1 미결 「220」과 같은 방향). 방법 B: 160 유지 + 사이드바 안쪽 8 + 링크 패딩 8 + 아이콘 칸 16 + 간격 6이면 글자 칸이 약 104(160−16−16−2−16−6)라 여전히 모자람 → **B만으로는 해결 안 됨.** 방법 C: `white-space: nowrap` + 말줄임은 잘린 라벨이 되므로 비권장. 라벨 줄이기는 문구 변경이라 종현 승인 필요. **권장 A**(종현 결정 필요). | `mypage-ops.css` L37(폭)·L52·L120–130, 1023px 이하 L639–643 `minmax(9rem)`→`10.5rem` 이상 | 전 역할 공통(학생 메뉴 폭도 같이 바뀜) | SPEC 6-B-1 미결과 **같은 결정** |

### P1: 쪽지·후기함을 마이페이지 틀로

| # | 할 일 | 파일 | 범위 | SPEC v2와 겹침 |
|---|---|---|---|---|
| P1-1 | **하위 탭을 SPEC 탭 규격으로.** `.msg-hub`: 아래 여백 24, 탭 14/500 패딩 12/16 #4B5563, 활성 700 + 역할색 2px(공부방·과외쌤은 `var(--role-accent)` = #266BC4 / #0F766E. **주의: 학생은 `udx` L20–24에서 `--role-accent`가 brand-blue라서, 학생 보라 #5B4BD6은 `s5b`의 `--s5-role`로 따로 지정해야 함**). #1d4ed8/#2563eb 하드코딩 삭제. | `home-provider-reviews.css` L146–151을 `mypage-ops.css`에서 덮어씀(또는 그 자리에서 수정) | 전 역할 공통(학생 2차 티켓 「쪽지 하위탭」과 같은 작업) | SPEC §3 #4·B2와 **같은 항목** |
| P1-2 | **쪽지 목록을 섹션 카드 안 행으로.** `.msg-list`를 흰 카드(r12, 1px, 패딩 0~24)로 감싸고 `.msg-row`는 테두리 없는 행 + 1px 구분선, 흰 바탕. 안 읽음은 soft 바탕(#EEF4FB) 또는 왼쪽 점만, 중요(노랑 #fffbeb/#f2d187)는 별 아이콘으로만 표시. | `messages/screens.js` L150–152(감싸는 div 1개), `mypage-ops.css`에 `.mypage-content .msg-*` 덮어쓰기 | 전 역할 공통(학생도 쪽지 사용) | SPEC §2-3 |
| P1-3 | **뱃지 7단계·r4.** `.msg-read-badge` 10.4px/pill → 12/600 r4 h20(`udx` L163 묶음에 추가), `.review-inbox__tag` pill → r4. | `udx-std-apply.css` L163–177 선택자 추가 또는 `mypage-ops.css` | 전 역할 공통 | 003 L41·L43 |
| P1-4 | **후기함도 같은 섹션 카드.** `section.review-inbox`에 카드 규칙, `.review-sheet__item`은 마이페이지 안에서 행 + 1px(r9.6 삭제). 후기 시트(바텀시트)는 `.review-sheet__*`를 같이 쓰므로 **`.mypage-content .review-inbox` 범위로만** 덮어쓸 것. | `mypage-ops.css` | 전 역할 공통 | — |
| P1-5 | **빈 상태 통일.** 쪽지 `msg-empty-plain`과 후기함 `review-sheet__empty`를 `renderEmptyStateCard('messages')` 같은 공용 `state-card`로 바꾼다(문구 「쪽지가 없습니다」는 그대로). 후기함 문구 「작성한 후기가 없습니다.」가 공급자에게 맞는지는 **종현 확인 후**. | `messages/screens.js` L133–136, `provider-reviews/inbox.js` L179–180 | 전 역할 공통(문구는 역할 분기 필요할 수 있음) | — |
| P1-6 | **펼침 시 제목 고정.** `/mypage/messages/thread/{id}`도 페이지 제목은 「쪽지·후기함」(학생은 「쪽지」)을 유지. 「대화방」은 행 안에서만 표시. | `src/mypage/router.js` L230–233 또는 `messages/router.js` L82 | 전 역할 공통 | SPEC 「메뉴 이동 시에만 제목 변경」 취지 |

### P2: 나머지 공부방 메뉴와 셸을 맞춤

| # | 할 일 | 파일 | 범위 | SPEC v2와 겹침 |
|---|---|---|---|---|
| P2-1 | **학생에만 들어간 셸 규칙을 전 역할로 올리기.** 경로 표시줄 #4B5563, 메뉴 활성 왼쪽 3px `var(--role-accent)` + 700, 비활성 500 통일(`is-emphasis` 600 해제 검토), 아이콘 역할색. | `s5b` L27–47의 값을 `mypage-ops.css` L120–172·L220–223으로 옮기고 학생 파일에서는 역할색 변수만 남김 | 전 역할 공통 | SPEC §2-2 「좌측 메뉴 항목」(현재 학생만 구현). 종현 확인: 셸 공통 확장 여부 |
| P2-2 | **내 공지 아래 여백 16→24.** | `mypage-ops.css` L1709 | 전 역할 공통 | SPEC §2-1 3 (1차 셸 범위 안인데 아직 안 됨) |
| P2-3 | **`--mp-muted` #6b7280 → #4B5563.** | `mypage-ops.css` L13 (또는 tokens `--product-muted`, 영향이 넓으므로 mp-ops 변수만 바꾸기 권장) | 전 역할 공통 | 003 L40 / SPEC 토큰표 |
| P2-4 | **최근열람·관심 학생·내 문의 내역을 섹션 카드 1장 안 행으로.** `mypage-panel--bare` + 개별 `.mypage-entity` 카드 → 흰 카드 1장 + 행 + 1px. 내 문의의 아래쪽 중복 버튼은 정리 검토(문구는 그대로). | `screens.js` L470–511·L409–468·L543–648(감싸는 마크업), `mypage-ops.css` L312–319·L709–723 | 최근열람·문의 = 전 역할. 관심 학생 = 공급자 공통 | SPEC §3 #3·#5 학생 2차와 **같은 템플릿**(after-5) |
| P2-5 | **찜: 패널 1장 + 소제목 2개 → 섹션 카드 2장(공부방/과외쌤), 패딩 24.** 빈 상태는 카드 안 카드를 피해 카드 본문 안 한 줄로. | `screens.js` L398–407, `mypage-ops.css` L234–240 | 전 역할(학생 「찜·비교」도 같은 함수) | SPEC §3 #2와 **같은 항목** |
| P2-6 | **계정설정: 히어로 그라데이션·그림자 제거, 카드 r12·그림자 없음·머리띠 제거, 카드 제목 18/700, 입력 16/#E5E7EB/r8, 이름 clamp → 22 또는 18.** | `home-member-flows.css` L333–466·L631–638을 `mypage-ops.css`에서 덮어씀 | 전 역할 | SPEC §3 #6과 **같은 항목** (섹션 카드 4장) |
| P2-7 | **내 등록 탭(공부방).** ≤720px 13px → 14 유지, 탭 패딩 12/16, 활성 글자 역할색, `.mp-room` gap 24. | `mypage-ops.css` L1208–1212·L1268–1300·L1633–1636 | `.home-app--role-study_room`(과외쌤도 원하면 공급자 공통) | SPEC B2 「탭 14, 활성 700+역할색 2px」(학생은 `s5b` L55–71) · C4 안쪽은 건드리지 않음 |

### 공통 섹션 카드 클래스 제안 (Cursor 참고)
학생 `s5b` L91–127이 같은 값(흰 바탕 · 1px #E5E7EB · r12 · 패딩 24 · 제목 18/700/1.3 · 설명 14 #4B5563 · 제목 묶음 아래 24)을 **학생 전용 선택자**로 갖고 있다. `mypage-ops.css`에 역할을 가리지 않는 `.mp-card` / `.mp-card__title` / `.mp-card__desc` / `.mp-card__rows`(행 패딩 12, 1px 구분선)를 한 번 정의하고, 구매이력·쪽지·후기함·최근열람·관심 학생·문의·찜·계정설정이 모두 같은 클래스를 쓰게 하는 것이 가장 적게 고치는 방법이다. 학생 4탭 CSS는 그대로 두면 된다.

---

## 5. 종현 확인이 필요한 것

1. **좌측 메뉴 폭**: 160 → 208~220으로 넓히는 것으로 「찜한 공부방·과외쌤」 줄바꿈을 해결할지(전 역할, SPEC 6-B-1과 같은 결정). 아니면 공부방 라벨을 줄일지(문구 변경).
2. **셸 메뉴 규칙(활성 3px·경로 표시줄 #4B5563·아이콘 역할색)을 공부방·과외쌤에도 적용할지.** SPEC v2에서는 학생만 구현된 상태.
3. **후기함 빈 문구 「작성한 후기가 없습니다.」**: 공급자(받는 쪽)용 문구를 따로 둘지.
4. **빈 값 문구 통일**(「미설정」「—」「없음」 → 「미입력」?): SPEC B3는 학생 마이프로필 범위라, 구매이력·계정설정에도 넓힐지.
5. **구매이력 범위**: 공부방만(`.home-app--role-study_room`)으로 할지, 같은 함수를 쓰는 과외쌤까지 같이 할지. 권장은 공급자 공통.
6. 하위 화면 이름 「구매이력」(P18-04)과 「구매내역」(P18-05)을 통일할지.

---

## 6. 추가 진단 (2026-10-09 19:1x KST, origin/main `0d125cc`)

### 6-1. 「마이샵」→「프로필 꾸미기」 이름 변경 이력

| 항목 | 내용 |
|---|---|
| 바뀐 커밋 | **`9ee8454` · 2026-09-28 08:09:52 KST** · 작성자 `leejetty-commits`(Cursor 구현 커밋) · `fix(mode-audit): ship P0–P2 routing, gates, and Korean copy (164–166)` · 본문 「166 P2: English/dev jargon → polite Korean UI terms (+ rework)」 |
| 바뀐 곳 | `study-room-reg/router.js` L81 `'P20-02': '마이샵'→'프로필 꾸미기'`, L110 탭 `{ key: 'hub', label: '마이샵' }→'프로필 꾸미기'`, `study-room-reg/screens.js` 기본정보·상세정보 아래 고스트 버튼 2곳(현 L352·L421). 같은 커밋에서 plans 안내 문구 「마이샵 꾸미기」→「프로필 꾸미기」(`plans/hub-home.js` L25·L101·L110, `plans/order-blocks.js` L459·L470, `plans/screens.js` L992) |
| 근거 문서 | `study114-ds/docs/166-mode-audit-p2-copy-terms-ticket.md`(2026-09-27 18:03 KST, 봇이 쓴 Cursor 티켓). 잠금표 L36은 **「마이샵(과외) → 프로필 꾸미기」**, N18 표 L107은 「유료·사이드 마이샵 → 프로필 꾸미기」, 주의 L166은 **「「마이샵」→「프로필 꾸미기」. 「샵」「스토어」잔존 금지.」** 출발점은 `163-mode-audit-2026-09-27.md` L64 N18 「**과외** 유료/사이드에 「마이샵」」(대상: 과외·학생). 후속 문서 `179`(L9 금지어 「마이샵」), `180`(L95–96)도 166을 그대로 따름 |
| 종현 결정 여부 | 163 머리말이 「**봇 내부 점검 정본 · 코딩·배포 지시 아님**」이고, 163·166 어디에도 종현 승인 표기가 없다. 문제 제기는 **과외쌤 화면의 「마이샵」**이었는데 166 주의문이 「샵 잔존 금지」로 넓게 쓰여서, Cursor가 **공부방 내 등록 첫 탭까지** 바꿨다. → **봇 티켓 문구가 넓었고 Cursor가 그대로 적용한 것.** 공부방 탭 이름을 따로 정한 종현 결정은 찾지 못함. `127-status-vocabulary-audit.md` L184에는 당시 탭이 「마이샵」으로 기록되어 있음 |
| 과외쌤 | 과외쌤 첫 탭은 **「마이프로필」**(`tutor-reg/router.js` L116)이고 이번 변경과 무관하다. 과외쌤 탭에 「마이샵」을 쓰지 않는다는 검사도 있음(`scripts/verify-tutor-mypage-frame-ia.mjs` L39) |

### 6-2. 코드 흔적 (docs 폴더 제외, origin/main)

| 문자열 | 파일 / 줄 | 성격 |
|---|---|---|
| 「프로필 꾸미기」 | **6파일 / 12줄** | **전부 화면 문구.** 공부방 탭·제목·버튼 4곳(`study-room-reg/router.js` L81·L110, `screens.js` L352·L421), 유료 안내 문구 6곳(`plans/hub-home.js` ×3, `order-blocks.js` ×2, `plans/screens.js` ×1, 공부방·과외쌤 공통 문장), 과외 홍보 `promo/tutor-content.js` L46·L101 |
| 「마이샵」 | **22파일 / 27줄** | 대부분 주석·규칙·테스트. 화면에 나오는 곳은 사실상 0. `state.js` L88 `myshop: { label: '공개 마이샵' }`는 SCREEN_META 라벨(역할 판정에 쓰고 화면 표시는 확인 못 함). 테스트: `e2e-inquiry-settings-closeout.mjs` L126(정규식 `마이프로필|마이샵`), `verify-wishlist-card-zoom-screen.mjs` L494·L510(설명 문자열). 규칙: `.cursor/rules/shop-page-lock.mdc` L27, `study114-workflow.mdc` L95 |
| `myshop` (대소문자 무시) | **31파일 / 205줄** | **내부 키.** 라우트 `#/myshop/study-room/:id`(공개 샵: `myshop/router.js`, `state.js` L538–566, `main.js` L335), 폴더 `src/myshop/**`, 렌더 `study-room-reg/myshop-render.js`(`renderMyshopShowcase`), data 속성 `data-myshop*`, CSS 파일 `myshop.css`·`myshop-public.css`(클래스는 `.shop*`/`.myshop-public*`), 확대카드 액션 `open-myshop`(버튼 글자는 「공부방 둘러보기」, `detail-decision/detail-shell.js` L125), 검사 스크립트 |
| `my-shop` | 0 | — |
| 그 밖의 화면 「샵」 | `study-room-reg/screens.js` L267 로딩 문구 「샵 페이지를 준비하고 있어요…」 | 화면 문구(166 「샵 잔존 금지」 위반 상태로 남아 있음) |
| API·DB | `myshop` 이름의 API·DB 컬럼은 없음. 공개 샵은 공부방 상세 API를 씀(`myshop/public-api.js` L2) | — |

**다시 「마이샵」으로 바꾸면 고칠 곳 = 화면 문구만**: `study-room-reg/router.js` L81·L110 + `screens.js` L352·L421(4줄). 라우트(`/mypage/registrations/study-rooms/:id`, 탭 key `hub`)·`#/myshop` 라우트·클래스·API는 그대로 둔다. 판단이 필요한 것: ① 유료 안내 6곳은 과외쌤도 보는 공통 문장이라 「프로필 꾸미기」 유지 또는 역할별로 나누기, ② 로딩 문구 「샵 페이지」, ③ docs 166·179·180의 「마이샵 금지」 잠금을 **공부방에 한해 해제**하는 문서 갱신(안 하면 다음 감사에서 다시 바뀜), ④ e2e 정규식은 이미 「마이샵」을 허용함.

### 6-3. 프로필 꾸미기 탭의 바깥 큰 박스

**공부방**
- 요소: `<article class="shop" data-myshop data-shop data-shop-root …>`(`study-room-reg/myshop-render.js` L246). 이 탭 본문 = `동네 인사` + 완성도 알림(nudge) + `renderMyshopShowcase()`(`study-room-reg/screens.js` L287). 그중 **`.shop` 하나가 큰 박스**다.
- CSS: `styles/myshop.css` **L3–35** `.shop`
  - `max-width: 58rem`(928) · `margin: 0.25rem auto 1.5rem`
  - **`padding: 1.1rem 1.15rem 1.6rem`**(17.6 / 18.4 / 25.6)
  - 바탕: radial 그라데이션 2겹 + linear(#f8fafc→#fffcf8→#fff)
  - **`border: 1px solid rgb(214 211 209 / .85)`** · **`border-radius: 1.35rem`**(21.6) · **`box-shadow: 0 .85rem 2rem rgb(28 25 23 / .06)`** · `overflow: hidden`
  - 등장 애니메이션 `shop-in`(L34·L37–46, translateY 8.8px, 0.5s)
- 기존 마이페이지 범위 규칙: `myshop.css` L676–679 `.mp-room-panel .shop, .mypage-panel .shop { max-width: 58rem }`, 모바일 L681–685 `.shop { padding: .85rem .7rem 1.25rem; border-radius: 1.1rem }`(범위 없음, 공개 페이지에도 적용).
- 넓어지는 폭: 좌우 패딩 18.4×2 + 테두리 1×2 = **약 39px**. 콘텐츠 열(1280 창에서 약 700~800px)에서 max-width 928은 걸리지 않으므로 이게 전부다. 안쪽 블록이 열 끝까지 차서 위쪽 `동네 인사` 카드·nudge와 좌우 끝선이 같아진다. 세로로는 위 약 22px(4+17.6), 아래 약 50px(25.6+24)이 줄어든다. ≤640에서는 좌우 약 24px(11.2×2+2).
- 권장 수정: `mypage-ops.css` 또는 `myshop.css` 끝에 **`.mypage-content .mp-room-panel .shop[data-shop-root], .mypage-content .mp-room-panel .shop.shop--loading { max-width:none; margin:0; padding:0; border:0; border-radius:0; background:transparent; box-shadow:none; overflow:visible; animation:none; }`**. 선택자 우선순위 (0,3,0) 이상이라 모바일 L681 규칙도 이긴다. 안쪽 `.shop-hero`·`.shop-bento__item`·`.shop-sec--*` 박스는 그대로 둔다.
- 부작용:
  - **같은 `.shop`이 공개 샵 `#/myshop/study-room/:id`에도 쓰인다**(`myshop/public-shell.js` L19·L45, 본문은 같은 `renderMyshopShowcase`). 그래서 범위 없이 `.shop`을 바꾸면 공개 페이지 모양도 바뀐다. **반드시 `.mypage-content`/`.mp-room-panel` 범위로만** 바꿀 것. 공개 쪽 바깥은 `.myshop-public`(max 60rem)이 감싼다.
  - 로딩 상태 `.shop.shop--loading`(`study-room-reg/screens.js` L266)도 같은 박스라 위 규칙에 포함시켜야 로딩→완료 때 박스가 깜빡이지 않는다.
  - `overflow:hidden` 해제는 영향이 거의 없다(히어로 이미지는 자기 radius·overflow를 가짐). 애니메이션을 끄면 라이트박스(position:fixed, L629 z-index 80)가 애니메이션 중에 transform 때문에 잘리는 문제도 없어진다.
  - `.cursor/rules/shop-page-lock.mdc`의 「owner/public 본문 분기 금지」는 **마크업 분기**를 막는 규칙이라 CSS 범위 덮어쓰기는 허용된다. 그래도 같은 규칙에 따라 `npm run verify:shop-page` 통과가 필요하다.
  - 바탕 그라데이션이 없어지면 히어로 아래 기본 로고 영역(`.shop-hero__media--default` 자체 그라데이션 L77–81)만 남는다. 안쪽 블록들이 회색 페이지 바탕 위에 바로 놓인다(종현 의도대로).

**과외쌤 (같은 자리 = 「마이프로필」 탭)**
- `tutor-reg/screens.js` L220–230 `renderHub` → `동네 인사` + `renderTutorProfileRead()`(`tutor-reg/profile-read.js` L202 `<div class="p21-profile">`).
- `.p21-profile`(`styles/tutor-profile-read.css` L5–10)은 **테두리·바탕·그림자·패딩이 없다** → 공부방 같은 바깥 큰 박스는 **없음**. 그래서 종현 결정 (g)의 「과외쌤 동일」은 **해당 없음**(고칠 것 없음).
- 다만 `max-width: 42rem`(672)이 걸려 있어 열 폭(약 700~800)보다 좁게 왼쪽에 붙는다. 「전체 폭」 취지라면 이 제한도 풀어야 약 30~130px 넓어지는데, 이번 결정은 「바깥 박스」만이라 **종현 확인 항목으로 남김**. 학생은 이미 `s5b` L79에서 같은 제한을 풀었음.

### 6-4. 과목·대상·교습형태 칸 라벨이 위에서 잘려 보이는 현상

- 코드상 겹침 없음: `.shop`이 flex column gap 21.6(`myshop.css` L17–19)이고, 히어로 다음에 bento가 온다. 음수 margin은 히어로 카드(`-2.1rem`, 히어로 이미지 위로 올림, L84)뿐이고 bento(`L154–194`)에는 음수 margin·transform·z-index가 없다. 데스크톱 캡처 `01-myreg-profile.png`에서는 라벨이 정상이다.
- 사용자 캡처를 확대해 보니 bento 세 칸 위쪽을 **같은 높이의 곧은 띠**(원본 기준 약 8px)가 가로질러 덮고, 히어로 카드와 bento 사이 간격도 21.6보다 짧다. 그림자라면 경계가 흐려야 하는데 곧은 경계라서 **스크롤 이어붙이기 캡처의 이음매**로 보인다. 띠 높이가 `shop-in` 애니메이션 이동량(translateY 0.55rem = 8.8px)과 거의 같다. 허브는 로딩 뒤 `hashchange`로 다시 그려지며(`study-room-reg/screens.js` L261) 그때마다 `.shop` 애니메이션이 다시 돈다. 그 중간에 이어 찍으면 이렇게 어긋날 수 있다. **판정: CSS 겹침 버그일 가능성 낮음. 라이브 재현 필요**(그 폭: 사이드바가 사라지는 ≤1023px, bento 3열).
- 같이 고칠 것: 라벨 `.shop-bento__label` **0.72rem = 11.5px**(L181–186)는 7단계 밖이라 작아서 잘려 보이기 쉽다 → 12px. 위 6-3 범위 규칙에서 `animation:none`을 주면 재현 원인도 사라진다.

---

## 7. 종현 결정 2026-10-09

| # | 결정 | 코드 위치 · 할 일 | 범위 |
|---|---|---|---|
| (a) | **좌측 메뉴 폭 160 유지** | `mypage-ops.css` L37 변경 없음. §4 P0-6(폭 넓히기)은 **취소** | 전 역할 |
| (b) | **「찜한 공부방·과외쌤」 두 줄 허용, 「찜한 공부방·」/「과외쌤」에서 줄바꿈 고정 + 줄간격·아이콘 위치 정리** | 지금은 88px 칸에서 아무 데서나 꺾임. `shell.js` L103–104에서 라벨을 `·` 뒤에서 나눠 `<span class="mypage-nav__label-line">찜한 공부방·</span><span …>과외쌤</span>`(또는 `·` 뒤 `<br>`)로 출력하고, 각 줄은 `white-space:nowrap`(「찜한 공부방·」≈79px라 88에 들어감). `.mypage-nav__link`를 `align-items:start`로 바꾸고 아이콘은 첫 줄 높이에 맞춤(line-height 1.3, 아이콘 칸 `padding-top`으로 첫 줄 가운데). 두 줄 항목만 위아래 패딩 유지, 줄간격 1.3. 라벨 글자는 그대로(문구 변경 아님) | 공부방·과외쌤(학생 라벨은 「찜·비교」라 해당 없음). 데이터는 `router.js` L81 공통 |
| (c) | **공부방·과외쌤 좌측 메뉴도 학생과 같은 모양**(선택 메뉴 왼쪽 3px 막대, 역할색 아이콘, 경로 글자색). 색은 각 역할색 | `s5b` L27–47의 규칙을 `mypage-ops.css` L120–172·L220–223으로 옮겨 공통화. 색은 `var(--role-accent)`: 공부방 #266BC4, 과외쌤 #0F766E(`udx` L8–18). 학생은 `udx` L20–24에서 `--role-accent`가 brand-blue이므로 `s5b`의 `--s5-role`(#5B4BD6)를 계속 씀. 경로 글자 #4B5563. 활성 굵기 700, `is-emphasis` 600도 같이 정리(§2). 과외쌤 활성 `udx` L26–31과 합치기 | 공부방·과외쌤(학생 현행 유지) |
| (d) | **화면에 개발자 용어 노출 금지 → 한글 라벨 (P0)** | 아래 표 7-1 | 전 역할 |
| (e) | **후기함 빈 문구: 공부방·과외쌤 「아직 받은 후기가 없어요. 좋은 수업은 언젠가 꼭 기억으로 돌아와요.」, 학생 현행** | `provider-reviews/inbox.js` L179–180(빈 상태), 문구 `provider-reviews/copy.js` L91–92 옆에 공급자용 키 추가. `getNavRole()`이 study_room/tutor면 새 문구 1줄만(아래 lead 「쪽지 상담 후에…」는 공급자에게 숨김. 학생은 「작성한 후기가 없습니다.」 + lead 그대로). 필터 모드 lead(L162)는 그대로. 모양은 P1-5 `state-card`로 같이 바꿈 | 공부방·과외쌤만 |
| (f) | **「구매이력」(메뉴)·「결제 내역」(본문) 현행 유지** | 이름 변경 없음. 하위 화면 「구매내역」(P18-05) 통일 건은 보류(§5-6 → 종현 미요청) | — |
| (g) | **프로필 꾸미기 탭 본문 바깥 큰 테두리 박스 제거, 과외쌤 동일, 마이페이지 범위만** | 6-3 규칙. 공부방 `.shop` 바깥만 제거. **과외쌤은 바깥 박스가 없어 해당 없음**(max-width 672는 확인 항목) | 마이페이지 안 `.mp-room-panel .shop` 한정(공개 샵 불변) |

### 7-1. 화면에 나오는 개발자 키 (grep, origin/main)

| # | 화면 | 지금 보이는 값 | 원인 (file:line) | 고칠 방법 |
|---|---|---|---|---|
| D1 | **최근열람** 행 「study_room · 상세 열람」 | 열람 경로 키 그대로 | `handoff-resume.js` L16: `RESUME_ROUTE_LABELS[lastRoute] \|\| lastRoute`. 라벨표(`handoff-copy.js` L114–121)에 search·parent·detail·wishlist·mypage·student-review만 있는데, 실제로 기록되는 값에는 **`study_room`(3곳)·`tutor`(3)·`guest`(2)·`resume`(4)**도 있다(`sourceRoute:` grep) | 라벨표에 study_room「공부방 홈에서」·tutor「과외쌤 홈에서」·guest「홈에서」·resume「이어보기에서」 같은 값을 추가하고(문구는 종현 확인), **모르는 키는 원문 대신 「탐색에서」로**. 같은 함수를 쓰는 상세 화면 리본(`renderEntryContextRibbon`, L32–35)도 함께 고쳐짐 |
| D2 | **구매이력 › 결제 내역** 상태 칸 「pending」「paid」 | 결제 상태 원문 | `mypage/screens.js` L808 `${esc(r.status)}`. 한글 변환 함수 `orderStatusLabel`(`plans/history-mock.js` L88–95: 결제완료·실패·취소·결제 대기)가 이미 있는데 안 씀 | `orderStatusLabel(r.status)`로 출력 |
| D3 | 구매이력 › 내 상품(`/mypage/plans/my`) 프로필 칸 「study_room #12」, 상태 칸 원문 | `provider_type`·`status` 원문 | `mypage/screens.js` L885·L892 | 「공부방」「과외쌤」 + 이름(또는 번호 숨김), 상태 한글 표 |
| D4 | 유료 서비스 안내(`/mypage/paid`) 상품 종류 「position」「count」, 이용중 뱃지 「PRIME D-3」 | kind·SKU 원문/영문 | `mypage/paid-screens.js` L44(`item.kind`), L80·L129(`sku.toUpperCase()`) | 「기간형 노출」「횟수형」 / 「프라임」「픽」(166 잠금: 영문 BASIC/PICK/PRIME 노출 금지) |
| D5 | 같은 화면 「데모 요금제: {tier}」 | 알 수 없는 tier 값이면 원문 | `paid-screens.js` L92 | 모르는 값이면 숨김 |
| D6 | 이용중 노출 이름 「XXX 노출」 | 모르는 SKU면 영문 대문자 | `mypage/screens.js` L661 `exposureKindLabel` | 모르는 값이면 「유료 노출」 |

(쪽지 칩 `contextLabel`·`scopeBadge`는 스토어 데이터라 코드만으로 판단 불가 → 라이브 확인 필요.)

### 7-2. Cursor 수정 목록 재정렬 (§4를 대체)

| 순위 | 할 일 | 파일 | 범위 |
|---|---|---|---|
| **P0-1** | (d) 개발자 키 → 한글: D1 최근열람 경로 라벨 + 모르는 키 대비 처리, D2 결제 상태 `orderStatusLabel`, D3 내 상품 프로필·상태 | `handoff-copy.js` L114–121, `handoff-resume.js` L16, `mypage/screens.js` L808·L885·L892 | 전 역할 |
| **P0-2** | (g) 프로필 꾸미기 바깥 박스 제거(로딩 박스·애니메이션 포함), bento 라벨 12px | `mypage-ops.css`(또는 `myshop.css` 끝)에 `.mypage-content .mp-room-panel .shop…` 1블록. `verify:shop-page` 실행 | 마이페이지 안 공부방만(공개 샵 불변) |
| **P0-3** | 구매이력 3섹션 → 같은 섹션 카드 + 안쪽 행 + 「쪽지상세」 버튼화 + 표 간격 + 빈 상태 통일 (§4 P0-1~P0-4 그대로, 이름 「구매이력/결제 내역」 유지 (f)) | `mypage/screens.js` L713–819, `mypage-ops.css` | 공부방·과외쌤 공통 |
| **P0-4** | (b) 「찜한 공부방·/과외쌤」 줄바꿈 고정 + 아이콘 첫 줄 정렬, (a) 폭 160 유지 | `mypage/shell.js` L103–104, `mypage-ops.css` L120–172 | 공부방·과외쌤 |
| **P0-5** | 구매이력 아이콘 `'◌'` 교체 | `mypage/router.js` L86 | 공부방·과외쌤에게 보임 |
| **P1-1** | (c) 좌측 메뉴 3px 막대·역할색 아이콘·경로 #4B5563·활성 700 → 공부방 #266BC4 / 과외쌤 #0F766E | `mypage-ops.css` L120–172·L220–223(학생 `s5b` L27–47과 같은 값), `udx` L26–31 정리 | 공부방·과외쌤 |
| **P1-2** | (e) 후기함 빈 문구(공급자), 학생 현행 + 빈 상태 모양 `state-card` | `provider-reviews/inbox.js` L161–180, `provider-reviews/copy.js` | 문구는 공부방·과외쌤, 모양은 전 역할 |
| **P1-3** | 쪽지·후기함 하위 탭 SPEC 규격(역할색), 목록을 섹션 카드 안 행으로, 뱃지 12/r4, 후기 항목 r12, 펼침 시 제목 고정 (§4 P1-1~P1-4·P1-6) | `home-provider-reviews.css` L146–151, `mypage-ops.css`, `messages/screens.js` L150–152, `mypage/router.js` L230–233 | 전 역할 |
| **P1-4** | D4~D6 유료 안내 화면 영문·원문 키 | `mypage/paid-screens.js` L44·L80·L92·L129, `mypage/screens.js` L661 | 공부방·과외쌤 |
| **P2-1** | 내 공지 아래 여백 24, `--mp-muted` #4B5563 (§4 P2-2·P2-3) | `mypage-ops.css` L1709·L13 | 전 역할 |
| **P2-2** | 최근열람·관심 학생·내 문의·찜·계정설정 섹션 카드화 (§4 P2-4~P2-6) | `mypage/screens.js`, `mypage-ops.css` | 학생 2차(C2)와 함께 |
| **P2-3** | 내 등록 탭 ≤720px 13px→14, 패딩 12/16 (§4 P2-7) | `mypage-ops.css` L1268–1300·L1633–1636 | 공부방 |

### 7-3. 남은 확인 (종현)
1. 공부방 첫 탭 이름을 「마이샵」으로 되돌릴지(문구 4줄만 바뀜). 되돌리면 docs 166·179·180의 「마이샵 금지」를 공부방에 한해 고칠지, 유료 안내 공통 문장 6곳은 「프로필 꾸미기」를 유지할지, 로딩 문구 「샵 페이지」는 어떻게 할지.
2. 과외쌤 마이프로필의 `max-width: 672`도 풀어 전체 폭으로 할지(바깥 박스는 원래 없음).
3. D1 경로 라벨 새 문구(「공부방 홈에서」 등) 확인.
