# 인수인계 — Cursor 지휘 체계 전환 · 3개 프로젝트 현황 (2026-10-08 00:40 KST, 03:58 갱신)

새 채팅은 이 문서를 먼저 읽고 이어간다. 작성: Cursor 메인 에이전트. 근거 대화: 2026-10-07 15:43 ~ 10-08 00:40.

## 1. 결정 사항

- **배경:** 그록봇이 지시·판단, Cursor 에이전트가 실행하는 구조에서 그록 쿼터가 빨리 소진됨. 사용자는 Cursor Ultra 보유.
- **역할 분담:**
  - 사용자 = 승인자 (배포·`main` 병합은 사용자 승인 후에만)
  - Cursor 메인 에이전트 = 지시서 작성·하위 에이전트 배정·검수·보고. **study114(우동공과)와 tour 담당**
  - 그록봇 = **campstory 영문화 담당 (위임)**. Cursor는 동기화 검증만
- **작업 방식:** 긴 작업은 백그라운드 하위 에이전트, 메인은 즉시 응답. 사용자가 작업 중 새 요청을 넣어도 기존 작업 유지·병렬 처리. 구현은 가벼운 모델, 검수·독립 리뷰는 강한 모델.
- **사용량 정책 (10-08 01:21, CSV 분석 결과):** 10-01~08 약 29억 토큰. 최대 원인 = 그록봇이 띄운 클라우드 에이전트 32개(`grok-4.7-high-fast`, 6.7억, 추정 ~$850), 다음 그록봇 자체(`grok-bot-default` 7.5억), 이 PC 채팅 Opus 5.5 high fast(3.2억). 대시보드: **Cursor 모델 통 28%**(3일), 기타 모델 통 1%. 10-05 추가 결제 2건 $28.59.
  - 사용자 조치: Grok 4.7 끄고 4.6 사용, Opus 최상위 끔.
  - 원칙: **Fast 변형 금지**, Claude는 위험도 높음 독립 검수만. 과제는 파일 몇 개 범위로 작게, 동시 2~3개. 대화가 길어지면 메인이 새 채팅 전환을 제안(자동으로 열 수는 없음)
  - **하위 에이전트 모델 (사용자 지시 10-08 01:29 「비싼 모델은 안 됨」):** 기본 `gemini-3.8-flash-high`(기타 모델 통, 저가). 결과가 부정확하면(같은 일 2회 실패) `claude-sonnet-5-5-high`까지만 올리고 사용자에게 알림. **10-08 04:04 사용자 승인:** `claude-sonnet-5-5-high`가 선택 목록에 없으므로 대신 `claude-4.6-sonnet-medium-thinking`(Claude 4.6 Sonnet) 사용 — 159c 재실행 포함. 금지: Opus·Fable 등 최상위, 이름에 `fast`가 붙은 모델(선택 목록의 `cursor-grok-4.6-high-fast`, `composer-2.5-fast` 포함 — Fast 아닌 판은 목록에 없음)
- **기록 원칙:** 작업기록은 각 저장소 `docs/worklog/`에 커밋·push. 저장소 밖·에이전트 가상 PC·채팅에만 있는 기록은 무효. 그록봇 컴퓨터·GitHub·이 PC 3곳 동기화.
- **루틴 정본 초안:** `D:\work\study114-routine` (브랜치 `docs/work-routine`, origin/main `2723c5f` 기준, **미커밋**)
  - `docs/internal/70-work-routine-review-approval.md`, `docs/worklog/README.md`, `docs/worklog/_TEMPLATE.md`, `.cursor/rules/work-routine.mdc`, `AGENTS.md`, 이 문서
  - 남은 일: `docs/internal/README.md` 목록에 70 추가(편집이 중간에 취소됨) → 사용자 승인 후 커밋·push·PR
  - 같은 규칙 요약을 `D:\work\study114\.cursor\rules\work-routine.mdc`에 미추적 파일로 두어 즉시 적용 중

## 2. study114 (우동공과) — `leejetty-commits/study114`

| 항목 | 상태 |
|---|---|
| 로컬 작업 폴더 | `D:\work\study114`, 브랜치 `feat/student-mypage-a-g`, origin/main보다 6커밋 뒤, **미커밋 수정 11개**(docs/ssot 등, 출처 미확인) + 미추적 `sql/schema/076_*.sql` 2개·`077_*.sql`(원본과 동일, `main` 맞출 때 삭제) + `.cursor/rules/work-routine.mdc` |
| worktree 다수 | `D:\work\study114-*` 20여 개 (예전 작업) |
| `main` | **`b249ccc`** (10-08 00:12 KST push). 162 3커밋(`598fb27`·`15f4eeb`·`b249ccc`)만 올라감 — `range-diff` 결과 검수본 `0a7005c`와 패치 동일. Deploy to dothome run `37645065754` 성공(00:34) |
| 배포 순서 (그록봇 확인 10-08 00:54) | **의도대로.** 정본 순서(docs/190·215) = 숨김 → 162 → 159c → 보류(hold-find-address), 한 건씩 배포 후 검수. 162 push는 그록봇의 클라우드 에이전트 `bc-7181c3a4`, GitHub 장애로 재시도 후 00:34쯤 ff. 162 배포 후 검수가 cron 503에서 멈춤 → 159c 대기 |
| 159c 다음 배포 주의 | `b249ccc` 위에 159c 병합 시 **3파일 충돌**(`a28-screens-bind.js`, `a28-screens.js`, `BasicCardRegisteredQuery.php` add/add). PHP는 159c 판이 162 판 + 관리자 메서드 145줄 추가(삭제 0)라 기계적 해결 가능, JS 각 4줄. **리베이스 = 새 커밋 → 재검수 필요**. hold-find-address는 `b249ccc` 위 충돌 없음 |
| cron 503 해석 | 코드상 Secret 미등록이면 키 검사 전에 503 반환(설계대로). "키 없는 POST = 403"은 Secret 등록 뒤에만 나옴 |
| 162 운영 조치 진행 | 10-08 00:55 사용자가 Secret `STUDY114_REPORT_CRON_KEY` 등록(64자 hex, 값은 사용자만 보관). 사용자 승인 「재배포하고 크론 403 확인까지 해줘」 → Deploy run `37645065754` attempt 2(`b249ccc`, 코드 변경 없음) 4잡 성공 → 키 없는 POST **403 확인**. 키를 클립보드에 두게 한 안내 실수로 키 분실 → 사용자 승인 「새 키 생성·파일 저장·Secret 등록·재배포·403/200 시험」 → 01:02 새 키(파일 `%USERPROFILE%\Documents\study114-secrets\report-cron-key.txt`, 저장소 밖) → run attempt 3 성공 → 키 없는 POST 403, 키 POST **200 `{"ok":true,"rows_created":35,"mails_sent":0,"mails_skipped":1}`**. 남은 것: 외부 웹 cron 등록(00:05·00:20 KST, 키는 위 파일), 관리자 보고서 화면·인쇄(사용자). `STUDY114_REPORT_MAIL_TO`는 주입 경로 없음 → 수신 = 활성 최고관리자 전원(216 §86) |
| cron 엔드포인트 | 운영에서 키 없이 호출 시 503(=`cron_key_unconfigured`, Secret 미등록 상태). 닷홈이 PHP 오류 응답 본문을 Apache 기본 페이지로 바꿔 상태코드만 보임. **Secret 등록 후 재배포해야 키가 `.htaccess`에 주입됨** |
| 주의 | 159c·162 동시 병합 시 3파일 충돌: `a28-screens-bind.js`, `a28-screens.js`, `src/Registration/BasicCardRegisteredQuery.php`(서로 다른 내용으로 새로 만듦). hold-find-address는 정본 `docs/ssot/13-search-page-fields.md` 변경 |
| 운영 DB | 076 2개 적용 완료, **077 적용 완료**(10-08 00:11). 확인용 쿼리는 대화 참조(064·069~077 존재 여부) |
| 162 운영 조치 | (위 「162 운영 조치 진행」이 최신) Secret 등록·재배포·403/200 시험 완료. 남은 것 = 외부 cron 등록, 관리자 보고서 화면·인쇄 확인(둘 다 사용자) |
| 그록봇 문서 동기화 | **완료·검증 통과 (10-08 00:55)** — GitHub `docs/grok-sync-20261007` = `dcf8b9c`(부모 `2723c5f`), 428개 전부 추가·전부 `docs/worklog/grok-sync/` 아래(.md 396·.txt 32, 2.9MB), 전부 UTF-8 정상, 비밀값 없음(의심 줄은 Secret 등록 절차 설명·FTP 배포 단계 이름뿐), `main` 문서와 내용·파일명 중복 0. 이 PC: worktree `D:\work\study114-docs`(upstream 연결, 수정 0). 구성: `docs/` 264개(001~216 지시서·검수 번호 문서) + 디자인·장애 메모 폴더 32개 |
| 그록봇 작업 배포 대조 (10-08 01:32) | 10월 그록봇 과제 중 미배포 = **159c**(`4c865bd`)·**보류 묶음 찾기 주소**(`26cadd3`)뿐. 162·숨김·159d·159ab·158·사이트오류 25~33은 `main`에 있음. 사이트오류-5·월간 콘테스트·관리자 메뉴 순서 등은 미착수 보류 |
| 9/22 옛 브랜치 2개 (그록봇 아님, 이 PC Cursor 채팅) | `cur-007-phone-identity`(`8a83697`, PR #27 열림) = 휴대폰 본인확인 설계만, **사용자 결정: 대기 유지**(본인인증 붙일 때 재검토·재설계). `cur-007-provider-identity`의 `5565414` = CSS 큰 파일 분리, 병합된 PR #26 브랜치에 잘못 얹혀 방치 → **사용자 결정: 실효, 제거**(10-08 01:41). 태그 `archive/css-split-20260922`로 보관 후 원격·로컬 브랜치 삭제. 파일 분리는 나중에 새로 |
| 로컬 미추적 문서 | `D:\work\study114\docs\046-…`, `047-…`, `README.md`는 grok-sync의 같은 이름 문서와 **내용 다름**(로컬은 09-24 초안, grok-sync는 「수락」 반영본; README는 서로 다른 문서). 로컬 정리 때 grok-sync 쪽을 기준으로 판단 |
| 배포 순서 변경 (10-08 02:19 사용자 승인) | 주소 통일(hold `26cadd3`)을 159c보다 먼저. 근거: 두 묶음 파일 겹침 0, hold는 `b249ccc` 위 충돌 0, SQL·Actions·`.htaccess` 변경 없음, 숨김 작업과 같은 파일(`StudyRoomRegisterService.php`)은 다른 함수. 독립 검수(Sonnet 5.5) = 조건부 통과 → 운영 DB SELECT 확인 결과 문제 없음(③④ 0건, ① '시 대표' 중복 6쌍만, ② '경기' 3행) |
| 주소 통일 배포 전 추가 수정 (승인) | 사용자 정책(10-08 02:51): **지역 조건이 없으면 검색 자체를 안 하고, 현재 위치 주소 그대로 하단 베이직 카드 유지.** (1) 학생 찾기 첫 화면 공부방 목록: 동 단위 위치면 `region_label` 요청 → hold 서버 거절 규칙으로 오류 → 현재 위치에서 시군구 id를 구해 베이직 카드 유지(못 구하면 요청 안 함). (2) hold가 새로 넣은 `runFindSearchWithFilters`의 `findScopeMissing` 분기가 주소 링크·저장 필터 복원 때 목록을 비움 → 검색 안 하고 현재 위치 베이직 카드 유지 + 안내만. 검색 버튼 경로(`runFindSearch`)는 이미 정책대로(안내만, 목록 유지). 검증 브랜치 `cursor/hold-find-address-merge-verify-20261008`에 수정 커밋 추가 후 재검사 → 마지막 hash로 승인 |
| 주소 통일 배포 후 할 일 (승인) | 서버 `SearchService`/`search.php`: 지역 조건 없는 검색은 **검색하지 않음**(빈 결과 또는 `region_required`). 게스트는 서버 `guestScopedFilters`가 기준 지역을 넣으므로 그 뒤에 판정. 홈 호출 4곳(공부방홈·과외쌤홈 학생 목록, 활동 차트, 공부방홈 라이브)은 모두 지역 id를 보내 영향 없음 확인. 정책 = 시군구까지만이면 베이직, 동·단지면 프리미엄 최대 3, 시·도만·지역 없음은 검색 불가 |
| 시·도 정식명 (승인) | `RegionAlias` 삭제 대신 `RegionEnsure`에서 재사용 → 브랜치 `cursor/region-sido-canonical-20261008` 작업 중. 사용자 할 일: 운영 DB `UPDATE regions SET sido_name='경기도' WHERE sido_name='경기'`(사전 SELECT A-1~A-3). '시 대표' 중복은 삭제 비권장(참조 확인 SELECT B-1·B-2만) |
| 레일 띠 그룹 색 (승인) | 커뮤니티(베스트·고민방·고민 팝업)=보라 `#6d28d9`, HOT=진홍 `#be123c`, 정보게시판(+팝업)=회청 `#475569`, 안내 카드·공지 팝업=파랑 유지. 상단 홍보배너 역할색(공부방 파랑·과외쌤 청록·학생 주황)과 겹치지 않게. 브랜치 `cursor/rail-band-group-colors-20261008` 작업 중 |
| 학생 마이페이지 디자인 통일 (그록봇 시안) | SPEC v2 = `D:\Users\jetty\Downloads\mypage-design-v2.zip`(SPEC.md·mockup.html·png). 확정: 마이프로필 상단 버튼·작은 「마이프로필」 삭제, 공란 「미입력」, 탭 14, 내 공지 soft·페이지 제목 28 전 역할, 좌측 제목 18, 「학부모」→「학생」, 주소칸 좌우 12. 과외쌤 마이프로필은 A1(버튼·문구)만. 1차 = 학생 4탭+셸, 2차 = 계정설정·찜·최근·문의·쪽지 하위탭(후기함은 학생에게도 보임 = 내가 쓴 후기). **착수 = 주소 통일 배포 후** |
| 동네 인사 최근 3개 (승인) | 홈 공개는 최신 1개, 고쳐 올리면 그 항목 교체 후 맨 위, 게시 중 표시·내리기·항목 삭제(×). 입력칸 전체 폭 + 올리기 제목줄 우측 + 입력칸 아래 목록. 서버 파일 JSON에 `history`(최대 3). 브랜치 `cursor/neighborhood-greeting-history-20261008` 작업 중 |
| 레일 영상 팝업 잔재 | `right-rail.js` 780줄~ 영상 팝업 바인딩·CSS = 보류(영상 배너 재사용 가능성). 최종적으로 안 쓰기로 하면 제거 |
| HOT·게스트 정책 확인 (사용자) | 지금 고민 HOT = 7일 반응 집계, 글 없을 때도 자리 유지. 표시 수 공부방·과외쌤 3, 학생 1, 게스트 3(제목만 — 게스트는 쓰기 불가, 회원 글 제목만 봄). 영상 슬롯은 보류, 정보게시판으로 대체가 맞음 |

### 진행 중 작업 스냅샷 (10-08 03:58 KST, 새 채팅 전환 시점) — 07:40 기준 5과제 모두 검수 완료, 아래 「5과제 검수 완료·배포 열」 참고

이전 채팅에서 띄운 하위 에이전트는 결과를 이전 채팅으로만 보고한다. 새 채팅은 아래 worktree·브랜치를 직접 확인해 이어간다(커밋이 없으면 수정 파일 상태로 판단, 멈췄으면 같은 지시로 다시 띄움).

| 과제 | worktree / 브랜치 | 03:58 상태 | 이어서 할 일 |
|---|---|---|---|
| 주소 통일 합친 상태 검증 + 배포 전 수정 2건 | `D:\work\study114-hold-verify` / `cursor/hold-find-address-merge-verify-20261008` | 커밋 `e7b825c`(02:21) + 미커밋 6파일 | 위 「주소 통일 배포 전 추가 수정」 (1)(2) 반영 확인 → 재검사(게이트·관련 verify) → worklog 기록 → push → 최종 hash 사용자 승인 |
| 레일 띠 그룹 색 | `D:\work\study114-rail-band` / `cursor/rail-band-group-colors-20261008` | 05:28 에이전트 오류 종료(1회 실패). 코드 수정 0, `tmp/` 게이트 산출물만 | Gemini 3.8 Flash로 재지시(2회째 실패 시 Sonnet 5.5) |
| 시·도 정식명 | `D:\work\study114-sido-canonical` / `cursor/region-sido-canonical-20261008` | 05:49 에이전트 오류 종료(1회 실패). 미커밋 2파일 +63 −11: `RegionAlias::SIDO_MAP`(17개 시·도 약칭·옛 이름 → 정식명), `RegionEnsure`가 정식명으로 INSERT, `findExisting`은 `sido_name IN (정식명, 원문)` | 이어서 마무리·검수. 확인할 점: ① `강원도`→`강원특별자치도`, `전라북도`→`전북특별자치도` 매핑이 운영 DB 기존 값과 맞는지(SELECT로 확인, 다르면 새 행 생길 위험 — `dong_code` 대체 조회가 막는지) ② `canonicalSido`의 다른 호출처 `AddressRegionMatch`(main에 있음, hold가 삭제)의 동작이 넓어짐 → 배포 순서 hold 뒤로 ③ hold 브랜치와 같은 파일 충돌 검사 ④ worklog·커밋·push 후 hash 승인 |
| 동네 인사 최근 3개 | `D:\work\study114-ng-history` / `cursor/neighborhood-greeting-history-20261008` | 07:42 에이전트 오류 종료. **원격에 3커밋 push됨**: `6c9fa67` 기능, `1988bef` 가짜 id 제거, `2ffda6c` 「검수 통과」 worklog. 단, 작업 폴더는 index·파일이 `b249ccc` 상태로 되돌려진 채 staged(8파일 −1304, worklog·verify 스크립트 삭제로 보임) — **이 상태로 커밋 금지**. 되돌림(`git restore --source=HEAD --staged --worktree -- .`)은 자동 검토가 막아 손대지 않음 | ① 작업 폴더 정리는 사용자 승인 후(또는 새 worktree를 `2ffda6c`에서 만들어 사용) ② `2ffda6c`의 「검수 통과」는 작업 에이전트 자체 기록 → 무효, 다른 세션(위험도 따라 Sonnet 5.5)이 독립 검수 ③ 레이아웃 정정(입력칸 전체 폭, 올리기는 제목줄 우측, 목록은 입력칸 아래) 반영 여부 확인 ④ 이 PC에 PHP 없음 → 서버 검사는 소스 기준 |
| 159c 리베이스 | `D:\work\study114-159c-rebase` / `cursor/admin-159c-rebase-20261008` | 11:05 에이전트 오류 종료(멈춤 후 종료 = 2회째 실패로 간주). 커밋 0, push 0. 병합 도중 멈춤: 새 파일 8개·수정 2개는 staged, **충돌 3개 미해결**(`a28-screens-bind.js`·`a28-screens.js` 둘 다 수정 UU, `BasicCardRegisteredQuery.php` 둘 다 추가 AA) — 예상했던 3파일 그대로 | Sonnet 5.5로 재실행: 충돌 3파일 해결(PHP는 162 판 + 159c 관리자 메서드 추가분, JS 각 4~5줄) → 159c 원본 검사 + 162 검사 재실행 → 커밋·push → 다른 세션 재검수 → hash 승인. 순서상 주소 통일 배포 뒤 |

**배포 위임 (10-08 04:17 사용자 승인 「배포까지 승인하겠다. 무결성은 제외.」, 사용자 취침):** 메인 검수 통과한 과제는 메인이 `main` 반영·배포·운영 확인까지 진행. 한 건씩 배포 → Actions 확인 → 운영 확인 후 다음. 순서 = 주소 통일 → 159c(리베이스 재검수 후) → 나머지(레일 띠·동네 인사·시·도). 무결성 검사에서 나온 수정은 배포 위임 대상 아님(보고만). SQL·Secrets 변경은 여전히 사용자 몫. **시·도 순서(04:20 확정):** 코드 배포 먼저 → 사용자가 기상 후 ①②③ 쿼리(③ UPDATE는 코드 배포 뒤에만; 옛 코드에서 UPDATE하면 「경기」 중복 행 재생성 위험). 「DB 먼저 필요한 배포」는 현재 없음 — 생기면 그 과제만 대기.

**다음 과제 예약 (10-08 04:09 사용자 결정): 공부방 모드 무결성 검사** — 진행 중 작업 전부 끝난 뒤 착수. 운영 `https://study114.net`, 공부방 모드만. 로그인 정보는 채팅 금지 → 사용자가 `%USERPROFILE%\Documents\study114-secrets\studyroom-login.txt`(1줄 아이디, 2줄 비번)에 저장 또는 브라우저 탭 직접 로그인. 메인 에이전트가 직접 로그인(하위 에이전트에 계정 전달 금지). 쿼터 절약(04:21 사용자 지시): 로그인 후 탐색은 저가 모델 browser-use 하위 에이전트에 로그인된 탭만 넘기고, 메인은 지시·결과 검수·보고서만. 범위: **결제만 제외, 나머지 쓰기 시험 허용**. 시험 글은 「[테스트]」 표시 후 원복·삭제, 다른 실제 회원에게 가는 쪽지·문의는 본인 다른 계정 대상 또는 건별 확인. 본인 수신 계정(학생 1·과외쌤 2) 목록 = `study114-secrets\test-recipients.txt`(저장소 밖). 로그인 파일 형식 확인 완료(04:13).

**하위 에이전트 정체 원인·조치 (10-08 06:40):** 04시대 하위 에이전트 3개가 2시간 넘게 수정 0 → 원인 = Cursor 자동 검토가 **작업 공간(`d:\work\study114`) 밖 쓰기를 차단**, `D:\work\study114-*` worktree 편집이 승인 대기 후 거절됨(이전 채팅 정체도 같은 원인 추정). 조치: 작업 공간 안 `d:\work\study114\.wt\{hold-verify,rail-band,ng-history,sido-canonical}`에 같은 브랜치로 worktree 재생성(`git worktree add -f`), `.git/info/exclude`에 `/.wt/` 추가(로컬 전용, 추적 파일 변경 없음). 시·도 미커밋 2파일은 패치로 옮김. 옛 `D:\work\study114-*` 폴더는 정리 대상(사용자 승인 후 삭제). **앞으로 하위 에이전트 worktree는 `.wt\` 아래에만.**

**배포 대기 (10-08 06:58):** 주소 통일 = 메인 검수 통과, 브랜치 `cursor/hold-find-address-merge-verify-20261008` 최종 **`7d4de59`**(수정 `d815df7` + 검수 기록), `origin/main` `b249ccc`에서 fast-forward 가능. `git push origin 7d4de59:refs/heads/main`이 Cursor 자동 검토에 차단(「보호된 main push는 명시적 사용자 승인 필요」) — 채팅 위임만으로는 통과 안 됨. 우회 금지 → 기상 후 승인 카드로 배포. 이후 과제도 검수까지만 해 두고 배포는 같은 방식으로 몰아서.

**5과제 검수 완료·배포 열 (10-08 07:40):** 5과제 모두 메인 검수 통과·push. 159c = `cursor/admin-159c-on-hold-20261008` `a1129f8`(코드 `a105f12`, 검수 기록 포함; 162 검사 FAIL 4건·등록 목록 FAIL 1건은 159c 전에도 같은 「옛 기준 커밋 대비 파일 목록」 오탐). 레일·동네 인사·시·도를 159c 위에 cherry-pick한 **배포 열** `.wt\train` / `cursor/deploy-train-20261008` 끝 **`49a6174`**(충돌 0, 원래 브랜치와 파일 내용 동일, 끝에서 전체 검사·`build:dothome` 통과, CSS 경고 2건은 기존). `main` fast-forward 순서: `7d4de59`(주소 통일) → `a1129f8`(159c) → `f25de2a`(레일) → `214e609`(동네 인사) → `49a6174`(시·도) → 사용자 시·도 SQL. 각 단계 승인 카드 + Actions + 운영 확인. 기록: 배포 열 브랜치 `docs/worklog/2026/10/2026-10-08-deploy-train.md`.

**무결성 검사 진행 (10-08 07:40):** worktree `.wt\integrity` / `cursor/integrity-studyroom-20261008`(from `b249ccc`). A. 손님 시점 공개 화면 = Gemini 3.8 Flash 하위 에이전트(읽기 전용) 진행, 산출 `tmp-integrity\guest-report.md`. B. 로그인 시점 = 비밀 파일을 읽어 로그인하고 세션 파일만 남기는 스크립트 `.wt\_integrity-auth\login.mjs`(커밋 안 함) 실행이 Cursor 자동 검토에 막힘(「운영 로그인은 사용자 승인 필요」) → 기상 후 승인 카드로 실행. 세션 파일만 하위 에이전트에 넘김(계정 전달 없음).

예상 소요(10-08 03:55 사용자에게 보고): 주소 통일 배포 직전까지 1.5~2시간, 마이페이지 디자인까지 5~6시간(승인 대기 제외).

**다음 할 일**
1. 실제 사이트 확인: 관리자 보고서 화면·인쇄(162 배포됨). hold-find-address·159c는 배포 여부 결정 후
2. 162 운영 조치(Secret 등록 → 재배포 → 외부 cron 등록 → `STUDY114_REPORT_MAIL_TO`) 사용자 진행 여부 확인
3. (선택) `D:\work\study114-docs` 매시간 `pull --ff-only` 예약 작업 — 사용자 승인 후
4. 루틴 정본 70 커밋·병합 승인 받기
5. 로컬 `D:\work\study114` 미커밋 11개 정리 방향 결정 후 `main` 최신화

## 3. tour (여행앱 기획·스파이크) — `leejetty-commits/tour` (비공개)

| 항목 | 상태 |
|---|---|
| 로컬 | `D:\work\tour` clone, 브랜치 `docs/grok-sync-20261007` = `16dc495`(문서 200개, 검증 완료: 범위·비밀값 OK) |
| 자동 동기화 | 예약 작업 `tour-docs-sync`: 매시간 `git -C D:\work\tour pull --ff-only` (안전 확인) |
| `main` / 스파이크 | `main` = `3d89e31`(README만), `spike/03-db` = `b362674`(수정6) — 그록봇 지휘 에이전트가 작업 중 |
| 검토용 worktree | `D:\work\tour-spike03-review` (detached, `b362674`, 읽기 전용 분석용) |

> **10-08 01:08 사용자 결정: tour 보류, study114 집중** (Cursor 사용량 점검 필요 — Ultra 3일 28% 사용). 재개 시 아래 상태에서 이어감.

**SPIKE-03 "복원 강제 중지" 기기 시험 반복 실패 (APK 5회, 6번째 빌드 중)**
- 시험 내용: 600칸 백업 복원 도중 Android 강제 중지 → 재실행 시 복구·판정 → 같은 실행에서 다음 회차, 5회 + 단계 B
- 5번째 APK 오류(2회차 재실행 뒤): `SELECT value FROM meta ... no such table: meta`, `DROP TABLE IF EXISTS members ... FOREIGN KEY constraint failed`
- **원인 1:** `src/spikes/s03_db/db/mutex.ts:5` `if (owner > 0) return fn();` — 누구든 실행 중이면 다른 흐름 호출도 줄 안 서고 진행 중 트랜잭션 안에 끼어듦. 재진입 자동 복구(useEffect → `finishRestoreHold` → `replaceWithSafety`) 도중 버튼, 버튼 중복 클릭(`onHold`에 즉시 표시·disabled 없음), 30초 대기 중 트랜잭션 보유. 하위 에이전트가 Node 비동기 가짜 핸들로 재현함
- **원인 2:** `PRAGMA foreign_keys = OFF`는 트랜잭션 안에서 무시됨 → `applyV1.ts:50-56`, `restore.ts:334-340`, `migrate/run.ts:211`
- Node 테스트가 못 잡는 이유: 동기 드라이버, 동시 호출 미시험, 강제 중지를 JS 롤백+정상 close로 흉내, 소스 문자열 검사
- 권장 수정: (1) 화면 busy 잠금·즉시 표시 (2) mutex owner 우회 제거, `transaction(fn)`이 tx 핸들 전달 (3) `PRAGMA defer_foreign_keys = ON` + 자식→부모 DROP (4) close·reopen 재도입 금지. APK 전 Node 동시성 테스트로 확인. `expo-dev-client`로 개발 빌드 1회 후 JS 직접 시험 가능
- 분석을 사용자가 그록봇에 전달함(10-08 00:34).
- **그록봇 회신(10-08 00:42):** 원인 1·2 동일하게 판단. 6번째 APK는 **아직 빌드 전**(GitHub `spike/03-db`도 `b362674` 그대로). 수정 요청에 반영: 트랜잭션 전용 핸들, 외래키 처리(`defer_foreign_keys` + 자식부터 DROP), 화면 점검·버튼 공용 실행 중 표시, 누르자마자 「복원 준비 중」, close 재도입 금지, 비동기 가짜 핸들 시험 3종(현재 코드 실패 출력 + 수정 후 통과 출력 둘 다 제출). 개발용 빌드는 이번 복원 시험 통과 후 T1부터 전환 권장
- 6번째 APK 시험 시: 버튼 한 번만, 판정 뜬 뒤 몇 초 후 다음 회차

**다음 할 일**
1. 수정 커밋이 push되면 **APK 빌드 전에** `spike/03-db` 받아 독립 검수: mutex 우회 제거·tx 핸들, PRAGMA 위치, busy 표시, 시험 3종을 Cursor가 수정 전 커밋(`b362674`)과 수정 커밋에서 직접 돌려 실패→통과 재확인
2. 검수 통과 후 6번째 APK → 기기 시험 결과 확인
3. 사용자가 원하면 Cursor가 tour 진행을 직접 맡음 (그 경우 그록봇 쪽 에이전트와 같은 파일 충돌 주의)

## 4. campstory (영문화) — `leejetty-commits/campstory-v1` · 그록봇 위임

| 항목 | 상태 |
|---|---|
| 로컬 | `D:\work\campstory\campstory`, 브랜치 `backup/signup-bonus-20260606-0400`(영문화 기준), origin보다 58커밋 뒤, 수정 없음. 원격 URL이 옛 이름 `campsound-v1` |
| `main` | `ed8352c`(2026-03-27) — **의도적으로 동결. 절대 건드리지 않음** (영문화와 섞지 않기) |
| 문서 동기화 | `docs/grok-sync-20261007` = `727bcdd`(41개) 검증 통과. 기준 `de29bda`. 참고: `en-fix-logic-codes-test` 등 일부 en 브랜치 커밋은 기준에 미포함 |
| 저장소 밖 자료 | `D:\work\campstory\en-assets` — 그록봇이 의도적으로 앱 폴더와 분리. 그대로 둠 |
| 이 PC에만 있는 것 | stash 4개, GitHub에 없는 로컬 브랜치 10여 개 — 지우지 말 것 |
| 3곳 동기화 | **완료·검증 통과 (2026-10-08 00:41)** — 원격 URL `campstory-v1`, 작업 폴더 `de29bda` = origin(수정 0), `campstory-docs` worktree `727bcdd` = origin(upstream 연결), `main` = `ed8352c` 유지, stash 4개·로컬 브랜치·`en-assets` 보존. 예약 작업 `campstory-en-sync`: `campstory-en-sync.cmd`(ff-only pull 2줄만), 매시간, jetty·Limited·Interactive, 첫 실행 01:34 |

**다음 할 일:** 없음(그록봇 위임). 영문화 문서는 그록봇이 `docs/grok-sync-20261007`에 커밋·push → 예약 작업이 이 PC로 당겨옴

## 5. 기타

- GitHub CLI: 이 PC는 `leejetty-commits`로 로그인(`repo` 권한). 그록봇 컴퓨터는 GitHub 로그인 없음 → Cursor 에이전트 경유 push
- 그록봇 컴퓨터 자료는 그록봇 말로는 사라지지 않음. 그래도 단일 사본이므로 GitHub 동기화 유지
