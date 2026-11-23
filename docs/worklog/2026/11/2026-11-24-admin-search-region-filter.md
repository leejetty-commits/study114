# 관리자 회원·등록 목록 지역 선택 검색 (2026-11-24)

- 지시: `origin/work/admin-search-region-filter-doc` 의 `docs/worklog/grok-sync/docs/admin-search-region-filter.md`
- 기준: `origin/main` `ab2bcfe2` (PR #296)
- 브랜치: `work/admin-search-region-filter`
- 실행: Cursor. 병합하지 않음.

## 한 일

회원 목록(`#/admin/members`)과 등록 목록(`#/admin/registrations`) 검색에 광역시/도 → 시군구 선택을 넣었다. 시군구 목록은 `GET /api/auth/regions.php?action=cities` 한 번만 불러 온다. 고른 지역은 공부방 홍보지역1(`slot=1`), 과외쌤 과외지역 1순위(`priority_order=0`), 학생은 기존 대표 지역 식과 맞춘다. 시군구를 고르면 그 조건만 쓰고, 시도만 고르면 그 시도에 속한 대표 지역만 남긴다. 둘의 시도가 다르면 「시군구가 고른 광역시/도에 속하지 않습니다.」

회원 서술 칸은 회원 이름, 이메일, 삭제되지 않은 공부방 이름, 과외쌤 이름, 그리고 숫자가 3자리 이상일 때만 하이픈을 뺀 전화번호만 본다. 지역 이름과 회원번호는 서술 칸에서 뺐다. `#/admin/members?user=번호`는 그대로다.

등록 목록의 숫자 지역 칸은 같은 선택으로 바꿨고, 이름 칸을 AND로 추가했다. 탭·시작일·종료일·표 열·빈 목록 문구는 그대로다.

스키마는 바꾸지 않았다.

## 검증

`php -l`은 바꾼 PHP 6개와 검증 스크립트에서 문법 오류가 없었다.

`php scripts/verify-admin-registration-list.php`의 SQL 항목은 통과했다. 이 PC의 도커 MySQL은 호스트 `3307`이고 사용자는 `root`라, 스크립트에 적힌 `3306` / `study114`로는 접속이 거부됐다. `study114_dev`에서는 `study_rooms` DROP이 다른 표의 외래 키에 막혀 스크립트가 거기서 죽었다. 그래서 SQL 항목만 빈 임시 데이터베이스에서 돌리고 그 데이터베이스는 지웠다. 스크립트 안의 접속 값은 원래 `3306` / `study114` / `study114_dev`로 되돌려 두었다. 먼저 `study114_dev`에서 끊긴 실행이 `study_room_regions`, `tutor_regions`를 지웠고, 백업으로 되돌렸다.

통과한 새 항목: `sido-seoul-includes-dong-room`, `sido-busan-zero`, `name-and-region`, `sido-region-mismatch-message`, `tutor-sido-unit-in-gangnam`. 기존 지역·숨김·기간 항목도 통과했다.

바이트 비교(`period-bytes`, `contract-*`)는 이 Windows 체크아웃이 CRLF라 실패했다. `where`, `bounds`, `from`, `selectList`, `countByRole`, `listByRole`, `countRole`, `assertRole` 본문은 고치지 않았다.

HTTP 항목은 스크립트가 `proc_open(/dev/null)`로 서버를 띄우다 Windows에서 실패했다. `sido-region-mismatch-422`도 그래서 상태 0이다. 같은 불일치는 저장소 호출에서 지정 문구의 예외로 확인했다. `AdminApi`는 `InvalidArgumentException`을 422로 바꾼다.

로컬 `study114_dev` 건수(이름·전화는 적지 않음):

| 조건 | 건수 |
|---|---|
| 서울특별시 + 강남구 + 정상 + 공부방 포함 | 0 |
| 서울특별시만 + 역할 전체 | 54 |
| 서술 `01012345678` | 66 |
| 서술 `010-1234-5678` | 66 |
| 서술 `+room1` AND 서울 | 0 |
| 학생 포함 + 강남구 | 0 |
| 학생 포함 + 서울만 | 0 |
| 등록 목록 과외쌤 + 서울 (2000-01-01~2099-12-31) | 27 |
| 시도와 다른 시군구 | 지정 문구 예외 |

강남구 0건은 아래 발견 목록 1번이다. 전화번호 두 서술은 같은 66건이다.

화면 캡처는 하지 못했다. 회원·등록 목록은 관리자 로그인과 콘솔 잠금 뒤에만 열리고, 비밀값은 읽지 않았다.

## 발견 목록

1. 로컬 `regions`는 5행이다. 강남구 행의 `official_code`가 비어 있어, 동 행과 시군구 코드 앞 5자리로 맞지 않는다. 픽스처처럼 `official_code`가 있는 강남구는 동 공부방을 포함한다.
2. 검증 스크립트는 외래 키가 있는 `study114_dev`에서 `study_rooms`를 지우지 못한다. 접속 포트·사용자도 이 PC의 도커 호스트와 다르다.
3. Windows CRLF 때문에 바이트 비교가 실패한다.
4. 검증 스크립트의 내장 서버 기동은 Windows에서 `/dev/null`을 열지 못한다.
