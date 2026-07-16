# 23장 — 게시판 메뉴 경계 진단·정렬 (2026-07-17)

**상태:** 진단 + 우선순위 1 구조 보정 · **Notion 23/30/33 동기화 완료 (2026-07-17)**  
**근거:** Notion 23·30·33·17·26장 · 코드 `preview/home-ui` · `src/Board`  
**코드 정본:** `preview/home-ui/src/board-engine-copy.js`  
**Notion:** [23장 §24](https://app.notion.com/p/90e9b270fac8458792cf3abafbf16450) · [30장 §22](https://app.notion.com/p/f7f93339f165443c85fcee5577ef4d15) · [33장 §23](https://app.notion.com/p/9d798e85f3134d7498ade23f66699fd5)

> 한 줄: 게시판 엔진은 콘텐츠 채널 관리용이고, 정적 정책은 정적 페이지로, 서비스 본체 기능은 서비스 화면으로 남긴다. 관리자에서는 boardKey를 프리셋 기반으로 안전하게 생성·운영한다.

---

## A. 적용한 문서 기준

| 문서 | 이번 작업에 적용한 기준 |
|------|-------------------------|
| **23장** | 상위=게시판 엔진 · boardKey 채널 · GNU 콘텐츠 비공유 · §20 메뉴별 게시판/비게시판 분리 |
| **30장** | boardKey ↔ route ↔ 소유 장 매핑(부록 C) · P26 정적 라우트 |
| **33장 §12** | 프리셋 기반 채널 생성 · 필수 메타 · 보호장치 · 약관 게시판 대체 금지 |
| **17장** | 고객센터 UX(공지/FAQ/가이드) · P17-06은 링크 허브만 |
| **26장** | 약관·개인정보·플랫폼 고지 = 정적 정본 |

---

## B. 현재 구조 진단표

| 메뉴/영역 | 현재 방식 | 문서 기준 | 문제 | 조치 | 관련 파일/route |
|-----------|-----------|-----------|------|------|-----------------|
| 고객센터 공지 | 게시판 UX + 전용 notice-store/API (board_posts 미사용) | boardKey `notice` | 엔진 통합 미완 · UX는 적합 | 2차: board_posts 이관 | `#/support/notice` · `notice-store.js` · `/api/support/notices.php` |
| FAQ | 정적 `FAQ_ITEMS` + 아코디언 UI | boardKey `faq` · UX 아코디언 OK | 운영 정본이 코드 시드에만 존재 | copy 문구 보정 ✅ · CMS 연동 2차 | `#/support/faq` · `support-copy.js` |
| 안전과외 가이드 | 정적 `GUIDE_ARTICLES` + 아코디언 | boardKey `safe-guide` | 엔진 미연동 | 2차 | `#/support/safe` · `support-copy.js` |
| 이용안내 | 역할별 정적 섹션 | 서비스/안내 화면 (보드 아님) | 없음 | 유지 | `#/support/guide` |
| 운영문의 | 티켓 서비스 화면 | 서비스 화면 | 없음 | 유지 | `#/support/contact` |
| 자료실 | board 엔진 API + 시드 | `library` | 정합 | 유지 | `#/library` |
| 양식/체크리스트 | board 엔진 | `library-template` | 정합 | 유지 | `#/library/templates` |
| 가이드 PDF | board 엔진 | `library-guide-pdf` | 정합 | 유지 | `#/library/guides` |
| 제출함 | board 엔진 + 마이페이지 | `submission` · guest write 금지 | registry에 demand write 혼재였음 | writeRoles 공급자만 ✅ | `#/mypage/submission-board` |
| 정책 변경 이력 | **미구현** · routeHint가 `#/policy/*` | `policy-log` 운영형 | **정적 정책 route와 와일드카드 충돌** | route → `#/policy/changelog` ✅ | phase2 |
| 약관/개인정보/플랫폼 고지 | 정적 policy 화면 | 정적 (26장) | `/support/terms` 레거시 잔존 | redirect → `/policy/terms` ✅ | `#/policy/{slug}` |
| 유료/검색/상세/등록/마이/쪽지 | 서비스 화면 | 서비스 화면 | 게시판 혼입 없음 | 유지 | 각 도메인 route |
| GNU 커뮤니티 | 미설치/미연동 | 별도 사이트 · SSO만 | 본체 보드와 섞인 route 없음 | 유지 | — |
| showcase | registry phase2 · enabled=false | 2차 후보 | 없음 | 비활성 유지 | — |
| 관리자 게시판 생성 | **없음** · A28-05는 공지 CMS만 | 33장 프리셋 생성 | 자유 생성 UI도 없음(다행) | 프리셋 로직·메타를 copy에 고정 ✅ | `BOARD_CREATE_PRESETS` |
| Board API 허용 키 | library* + submission만 | 운영형도 장기적으로 엔진 | notice/faq/safe-guide API 미포함 | 의도적 1차 범위 · 문서화 | `BoardPostService.php` |

---

## C. 게시판으로 처리할 메뉴 확정표

| 메뉴명 | boardKey | 소속 | 공개 | 작성/업로드 | 비고 |
|--------|----------|------|------|-------------|------|
| 공지사항 | `notice` | 고객센터 | 공개 read | admin write | UX 목록·단일오픈 |
| FAQ | `faq` | 고객센터 | 공개 read | admin write | UX 아코디언 가능 |
| 안전과외 가이드 | `safe-guide` | 고객센터 | 공개 read | admin write | UX 카드/상세 가능 |
| 정책 변경 이력 | `policy-log` | 정책 이력 | 공개 read | admin write | route=`#/policy/changelog` · phase2 |
| 자료실 | `library` | 자료실 | 로그인 read/dl | admin write | |
| 양식/서식함 | `library-template` | 자료실 | 로그인 download | admin write | |
| 가이드 PDF | `library-guide-pdf` | 자료실 | 공개 read · 로그인 dl | admin write | |
| 제출함 | `submission` | 마이페이지 | 공급자 role | supply write/upload · guest 금지 | |
| 사례 공유 | `showcase` | phase2 | — | — | enabled=false |

---

## D. 게시판으로 처리하면 안 되는 메뉴

| 메뉴명 | 방식 | 근거 |
|--------|------|------|
| 이용약관 · 개인정보 · 플랫폼 역할 고지 | 정적 | 26장 · 23§20-2 · 33§12-5 |
| 제출자료/신뢰정보·학생정보·신고 고지 | 정적 | 26장 P26-04~07 |
| 유료 카탈로그 · 내 상품 · 결제내역 | 서비스 | 18·34장 |
| 검색 · 상세 · 등록 · 마이페이지 | 서비스 | 13·14·15장 |
| 회원 간 쪽지 | 메시지 | 16장 |
| 운영문의 티켓 | 서비스 | 17장 P17-07 |
| 이용안내(역할 요약) | 안내 화면 | 17장 · 보드 채널 아님 |
| GNU 자유 게시판 | 외부 | 23장 · 콘텐츠 비공유 |

---

## E. 관리자 게시판 생성 로직 (초안 · 33장 정합)

### 프리셋
운영 공지형 · FAQ형 · 가이드형 · 자료실형 · 제출형 · 큐레이션형  
→ 코드: `BOARD_CREATE_PRESETS`

### 생성 플로우
1. 소속 메뉴군(`sectionOwner`) 선택  
2. 프리셋 선택  
3. menuLabel / boardKey / routeSlug  
4. 권한 기본값 자동 주입  
5. 공개·다운로드·업로드 확정  
6. 저장 + 운영로그  

### 필수 메타
`boardKey` · `menuLabel` · `boardType` · `routeSlug` · `sectionOwner` · `visibility` · `downloadPolicy` · `allowWrite` · `allowComment` · `allowUpload` · `allowedRoles` · `requireReview` · `isGnuSeparated`

### 보호장치
- 중복 boardKey 금지 · route 충돌 · sectionOwner 필수  
- 정적 정책 slug 경고 (`STATIC_POLICY_RESERVED_SLUGS` · `validateBoardChannelCreate`)  
- guest write 금지(제출형) · 삭제보다 archive/hidden · GNU 분리 표시  

### 남은 결정
- A28-05를 「공지 CMS」만 둘지 · 「채널 추가」마법사를 같은 메뉴에 둘지  
- notice/faq/safe-guide를 `board_posts`로 이관하는 시점  
- `policy-log` UI를 푸터 vs 정책 사이드에 둘지  

---

## F. 이번 라운드 실제 수정

| 파일 | 이유 | 기대 효과 |
|------|------|-----------|
| `board-engine-copy.js` | 프리셋·sectionOwner·policy-log route·submission 권한·검증 헬퍼 | 문서·코드 정본 일치 |
| `support/router.js` · `state.js` | `/support/terms` → `/policy/terms` | 정적/게시판 경계 명확 |
| `policy-router.js` | `POLICY_CHANGELOG_PATH` 예약 | 와일드카드 충돌 제거 |
| `support/screens.js` | FAQ lead 문구 | “정적=임시, 엔진=정본” 오해 방지 |
| `admin/a28-screens.js` | A28-05 힌트 | 자유 생성 유도 방지 |
| `30-…inventory.md` · `23-…draft.md` | policy-log route 수정 | 30·23 정합 |

---

## G. 보류 (2차)

- notice/faq/safe-guide → `board_posts` 통합 API  
- `#/policy/changelog` 화면 구현  
- showcase 활성화  
- GNU 설치·SSO  
- FAQ/가이드 UX 고도화(카드형 등)

---

## H. 2026-07-17 운영 가능 최소판 — 채널/우측 슬롯

### H-1. 채널 진단표 (코드 기준)

| boardKey | 현재 존재 | 저장소/엔진 | route | read | write | 관리자 운영 | 문제 | 조치 |
|----------|-----------|-------------|-------|------|-------|-------------|------|------|
| `notice` | ✅ | **board_posts** + static seed fallback | `#/support/notice` | public | admin | ✅ A28-05 | — | **완료(3탄)** |
| `faq` | ✅ | **board_posts** + static seed fallback | `#/support/faq` | public | admin | ✅ A28-05 | — | **완료(3탄)** |
| `safe-guide` | ✅ | **board_posts** + static seed fallback | `#/support/safe` | public | admin | ✅ A28-05 | — | **완료(3탄)** |
| `policy-log` | ✅ phase2 | channel config | `#/policy/changelog` | public | admin | ✅ A28-05 설정 | 화면 미구현 | 2차 |
| `library` | ✅ | `board_posts` + seed fallback | `#/library` | login | admin | ✅ A28-05 설정 | admin write API 없음 | 후순위 |
| `library-template` | ✅ | `board_posts` + seed fallback | `#/library/templates` | login | admin | ✅ A28-05 설정 | admin write API 없음 | 후순위 |
| `library-guide-pdf` | ✅ | `board_posts` + seed fallback | `#/library/guides` | public read/login dl | admin | ✅ A28-05 설정 | 실제 파일 저장소 없음 | 후순위 |
| `submission` | ✅ | `board_posts` + submission store | `#/mypage/submission-board` | 공급자/admin | 공급자 upload | ✅ A28-05 설정 + A28-06 큐 | 운영 검토 큐 고도화 필요 | 후순위 |
| `showcase` | ✅ disabled | channel config | — | role | 공급자 후보 | ✅ A28-05 설정 | 2차 전 비활성 | 유지 |

### H-2. 우측 슬롯 진단표

| slotKey | 현재 존재 | 렌더 위치 | 데이터 공급 | 게시판 연결 | 모바일 | 문제 | 조치 |
|---------|-----------|-----------|-------------|-------------|--------|------|------|
| `home_right_rail` | ✅ | `renderHomeShell` | `right-rail-store` seed/API | notice/library/safe-guide | stack | — | 완료 |
| `search_right_rail` | ✅ | search-ui `layout.js` | seed/API | faq/library-template/safe-guide | stack | — | **완료(3탄)** |
| `detail_right_rail` | ✅ | P24 detail modal inline block | seed/API | safe-guide/submission/notice | collapse | — | **완료(3탄)** |
| `register_right_rail` | ✅ | `mypage/registrations*` | seed | library-template/faq/safe-guide | stack | 등록 전용 외부 SPA 미연결 | 2차 |
| `plans_right_rail` | ✅ | `plans` shell | seed | notice/faq/safe-guide | collapse | checkout/result는 숨김 | 완료 |
| `support_right_rail` | ✅ | support/library/policy shell | seed | notice/faq/library-guide-pdf | stack | 없음 | 완료 |

### H-3. 구현 결과

| 계층 | 구현 |
|------|------|
| 채널 설정 | `board-channel-store.js` · registry seed + **DB(`board_channel_definitions`)** + sessionStorage dev fallback |
| 우측 슬롯 설정 | `right-rail-store.js` · seed + **DB(`right_rail_slot_definitions`)** + sessionStorage dev fallback |
| 운영형 콘텐츠 | `operational-board-store.js` · **board_posts** 정본 · static seed fallback |
| API | `GET/POST /api/admin/content/channels.php` · `GET/POST /api/admin/content/right-rails.php` |

### H-4. 기본 slot seed

| slotKey | 기본 sourceBoardKeys | 용도 |
|---------|----------------------|------|
| `home_right_rail` | `notice`, `library`, `safe-guide` | 운영 공지 · 추천 자료 · 처음 이용 가이드 |
| `search_right_rail` | `faq`, `library-template`, `safe-guide` | 비교/검색 도움말 · 체크리스트 |
| `detail_right_rail` | `safe-guide`, `submission`, `notice` | 안전 접촉 · 제출자료 안내 |
| `register_right_rail` | `library-template`, `faq`, `safe-guide` | 작성 가이드 · 제출 전 체크 |
| `plans_right_rail` | `notice`, `faq`, `safe-guide` | 상품 이용 안내 |
| `support_right_rail` | `notice`, `faq`, `library-guide-pdf` | 최신 공지 · FAQ · PDF |

### H-5. 보류 (3탄 이후)

- FAQ/가이드 **관리자 CMS** 전용 편집 UI (현재는 공지 CMS + board_posts API)
- manual curated picker / drag & drop
- `#/policy/changelog` 화면 구현
- showcase 실운영 활성화

### H-6. 2026-07-17 3탄 — board_posts · 영구 저장 · rail 연결

| 항목 | 결과 |
|------|------|
| SQL | `034_board_operational_channels.sql` · `035_content_config_definitions.sql` |
| PHP | `BoardPostService` notice/faq/safe-guide · `ContentConfigService` |
| 프론트 | `operational-board-store.js` · `content-config-backend.js` |
| detail rail | `detail-shell.js` → `renderRightRailBlock('detail_right_rail')` |
| search rail | `search-ui/layout.js` → `renderRightRailSidebar('search_right_rail')` |
| sessionStorage | 채널/슬롯 **dev fallback** · DB/API가 정본 |
