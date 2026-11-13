# 2026-11-14 실시간 퀵매칭 0단계

## 지시

origin 브랜치 `docs/realtime-quickmatch-spec-2026-11-13`의 `docs/worklog/grok-sync/docs/realtime-quickmatch-spec-2026-11-13-0-common.md`를 따라 0단계만 한다. 커밋·PR까지. 머지 금지.

종현 결정: (1) `students.quick_match_prefs` 추가 승인, (2) `preferred_tutor_gender` 라벨 재사용, (3) 운영 기록표 3개와 `thread_origin` 승인, (4) 후기는 퀵매칭 탭, (5) 공부방 수업료가 비면 그 조건은 건너뜀. 나머지 E절은 조사 후 보고.

## C-0 조사

1. B절의 등록·쪽지·후기·프라임 조회 함수는 이 브랜치(main `ead5ec91`)에 있다.
2. 다음 SQL 번호는 089. 086은 `work/339-pg-portone-sandbox`, 088은 `work/365-identity-design`에 있다. 089 파일은 원격에 없었다.
3. 메시지가 0개인 스레드는 목록 SQL이 깨지지 않는다. 상세는 미리보기가 있으면 그 문장을 말풍선처럼 그리고, 없으면 「대화를 불러오는 중…」을 보여 준다.
4. `replyMessage()`는 쪽지권을 차감하지 않는다. 차감은 공급자가 학생 맥락의 새 대화를 만들 때만이다.
5. `PositionPeriodCalculator::BUSINESS_TZ`는 `Asia/Seoul`이다. PDO는 `time_zone`을 맞추지 않고, 프라임 활성 SQL은 `CURDATE()`를 쓴다. 자정 무렵 서울 날짜와 어긋날 수 있다. 퀵매칭 하루 셈은 PHP 서울 날짜를 쓴다. 프라임 SQL은 그대로 둔다.
6. `hasMessageThread()`는 메시지가 0개여도 공급자 맥락 스레드가 있으면 통과한다. 퀵매칭 스레드는 학생 맥락이라 그 함수를 통과하지 않는다. 퀵매칭 후기는 공급자 메시지가 1개 이상일 때만 통과하게 추가했다. 일반 게이트는 그대로다.
7. E-1, E-2, E-6, E-7, E-8은 종현 결정이 왔다. E-3, E-4, E-5, E-9, E-10, E-11은 구현하지 않았다.

## 구현에서 문서와 다르게 둔 것

유형별 매칭기가 없는 0단계에서 지역만 겹친다고 쪽지를 보내면 AND 매칭이 아니다. `QuickMatchDispatcher::MATCHERS_READY`는 false이고, 이 상태에서는 발송 기록도 남기지 않는다. 기록이 있으면 1단계의 등록 발송이 막히기 때문이다. 발송 흐름 코드는 두되 이 상수 뒤에서만 돈다.

설정 저장은 선택 조건이 있을 때만 한다. 비어 있으면 400(`no_toggles`)이고 `first_saved_at`·`last_changed_at`을 기록하지 않는다. 조건이 있는 첫 저장이 그 시각(서울)부터 7일을 센다. 화면의 다음 변경일은 「11월 21일」이다. 학생 쪽지 조언은 학생 화면만 보여 준다.

## E절

| 항목 | 처리 |
|---|---|
| 1 선택 조건 칸 | 승인. 089에 `students.quick_match_prefs` |
| 2 희망 원장 성별 | 승인. 칸을 만들지 않고 `preferred_tutor_gender`를 재사용. 라벨 화면은 1단계 |
| 3 성별·강의스타일 위치 | 학생 상세에 그대로 둠. 기본정보로 옮기지 않음 |
| 4 스위치 문구 | 0단계 화면에 스위치가 없음. 시안 문구는 1·2단계에서 따름 |
| 5 교습비 | 학생·과외쌤 `preferred_fee_amount`는 원(화면은 천원, ×1000). 공부방 `monthly_fee_manwon`은 문자열이고, 비어 있을 때 `price_amount/1000`을 넣는다. 이름과 단위가 다르다. 범위가 아니므로 비교 규칙을 만들지 않음 |
| 6 공부방 수업료 빈 값 | 그 조건을 건너뛰고 공부방은 남긴다. 비교 코드는 2단계. 발송기에 결정만 적음 |
| 7 운영 기록 | 승인. 표 3개와 `message_threads.thread_origin` |
| 8 후기 탭 | 승인. 일반과 퀵매칭이 둘 다 있으면 퀵매칭 탭 |
| 9 학생 카드 보내기 하루 5건 | 만들지 않음 |
| 10 동의 문구 | `PRIME_MATCH_LABEL`은 과외쌤 문장 그대로 |
| 11 학교명 | 쪽지 줄에 학교명·스카이를 넣지 않음 |

## 확인

- `preview/home-ui`에서 `npm run build` 성공.
- `verify-tutor-mypage-route-integrity` 통과. 퀵매칭 메뉴는 계정설정 바로 위, 학생 메뉴에는 없음.
- `mypage-quick-match.css` 중괄호 깊이 0.
- PHP 문법: 우동공과3이 변경 PHP 15개를 PHP 8.3으로 검사. 모두 `No syntax errors`.
- 089는 실행하지 않았다. 로그인된 마이페이지와 설정 API는 로컬 PHP가 없어 브라우저로 확인하지 못했다.
- 머지하지 않음.
- 검수 수정: 선택 조건이 없으면 저장 버튼을 숨기고 서버는 400(`no_toggles`). 조언 문장은 학생(`parent`) 화면만, 문구는 「학력·등록 여부 등은 쌤이 직접 입력한 정보예요. 상담하실 때 증명서류를 직접 확인해 주세요.」 다음 변경일 표시는 「11월 21일」.

## [최종검수 패키지 — 실시간 퀵매칭 0단계]

```
[최종검수 패키지 — 실시간 퀵매칭 0단계]
브랜치 / 커밋: work/quick-match-0-common / 6e96eeff
PR: https://github.com/leejetty-commits/study114/pull/208 (머지 안 함)
변경 파일: git diff --stat origin/main...6e96eeff
  29 files, +1469 / -23
  sql/schema/089_quick_match_foundation.sql (+127) 와 rollback (+72)
  src/QuickMatch/* 5개 (Dispatcher 370, Settings 236, Schema, PrimeGate, HttpException)
  public/api/quick-match/settings.php
  기존 훅: BasicRegister, StudentHub, StudyRoomRegister, Messages, Reviews, ProviderStatus
  화면: 메뉴·설정 틀·쪽지/후기 탭·quick-match CSS
  docs/worklog/2026/11/2026-11-14-quick-match-0.md
diff 요약:
  - 089: 나이대 3칸, quick_match_prefs, thread_origin, 운영 기록표 3개. 멱등. 실행은 종현 phpMyAdmin.
  - 메뉴는 계정설정 바로 위. 프라임만 황금색. prime_active는 기존 상태 응답에만 추가.
  - 설정 API는 필수 조건을 400으로 거절. 선택 조건이 비면 400(no_toggles), 시각 미기록. 비프라임 POST는 403. 조건이 있는 첫 저장부터 서울 시각 7일. 표시는 「11월 21일」.
  - 학생 조언은 parent 화면만. 문구는 증명서류 직접 확인.
  - 쪽지·후기 탭 일반/실시간 퀵매칭. 학생은 공급자 메시지가 없는 퀵매칭 쪽지를 보지 않음.
  - 퀵매칭 후기는 공급자 메시지 1개 이상일 때만. 일반 후기 게이트는 그대로.
  - MATCHERS_READY=false. 유형별 매칭 전에는 쪽지와 발송 기록을 만들지 않음.
테스트: preview/home-ui npm run build 성공. verify-tutor-mypage-route-integrity 통과.
PHP 문법: 우동공과3, 변경 PHP 15개 모두 No syntax errors (PHP 8.3).
CSS: mypage-quick-match.css 중괄호 깊이 0.
브라우저: 로그인 화면·설정 API는 로컬 PHP가 없어 확인하지 못함.
운영 SQL: 089 미실행.
미해결·종현 결정 필요:
  - E-3 성별·강의스타일 위치 (상세에 그대로)
  - E-4 스위치 문구 (0단계에 스위치 없음)
  - E-5 교습비 단위 (학생·과외쌤은 원, 화면은 천원. 공부방 monthly_fee_manwon은 문자열이고 빈 값 대체는 price_amount/1000. 비교 규칙 없음)
  - E-9 학생 카드 하루 5건 (미구현)
  - E-10 동의 문구 (과외쌤 문장 유지)
  - E-11 학교명 (쪽지에 넣지 않음. 추가 결정 없음)
  - E-6은 결정됨: 공부방 수업료가 비면 그 조건만 건너뜀. 비교는 2단계.
```

## 배포 전 사용자 할 일

운영 phpMyAdmin에서 `sql/schema/089_quick_match_foundation.sql`을 적용한다. Actions는 이 SQL을 실행하지 않는다.
