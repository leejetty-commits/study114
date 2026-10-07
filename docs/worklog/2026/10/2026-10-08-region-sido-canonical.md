# 작업 기록: 새 지역 행 시·도 정식명 정규화 (region-sido-canonical)

- 작업 일자: 2026-10-08
- 작업 브랜치: `cursor/region-sido-canonical-20261008` (기반 HEAD: `b249ccc`)
- 작업 디렉토리: `d:\work\study114\.wt\sido-canonical`
- 상태: 검수·승인 대기

---

## 1. 지시서 원문

```markdown
너는 study114 작업자다. 보고는 한국어. Windows PowerShell.

## 규칙 (반드시)
- 작업 폴더: `d:\work\study114\.wt\sido-canonical` (브랜치 `cursor/region-sido-canonical-20261008`, HEAD `b249ccc`). 이 폴더에서만 읽기·편집·검사·커밋·push.
- Cursor 는 작업 공간(d:\work\study114) 밖 쓰기를 막는다. `D:\work\study114-*` 폴더에는 쓰지 마라. d:\work\study114 루트 작업트리와 다른 `.wt\*` 폴더도 건드리지 마라.
- `git add -A` 금지, 허용 파일만 개별 stage. main push/merge 금지. amend 금지.
- 허용 수정 파일: src/Region/RegionEnsure.php, src/Region/RegionAlias.php(필요 시 최소), 새 scripts/verify-region-sido-canonical.mjs, worklog 파일. 그 외 수정 금지(특히 src/Region/AddressRegionMatch.php, src/Search/*, preview/*).
- 편집 도구가 거절되면 재시도하지 말고 'EDIT_BLOCKED' 와 거절 문구를 보고하고 끝내라.

## 현재 상태
이전 작업자가 코드 수정 2파일을 미커밋으로 남기고 중단했다(이 폴더에 옮겨 두었다. `git diff` 로 확인):
- RegionAlias.php: `SIDO_MAP` 상수(줄임말·옛 이름 → 정식명) + canonicalSido() 가 이를 사용.
- RegionEnsure.php: fromKakao 에서 `$canonicalSido = RegionAlias::canonicalSido($sido)`, INSERT 에 정식명 사용, findExisting(정식명, 원래값) 으로 `sido_name IN (?, ?)`.
남은 일 = 아래 검토·검사 스크립트·검사·기록·커밋·push.

## 배경 (원 지시 요지)
- 운영 DB regions.sido_name 에 '경기도' 32행과 줄임말 '경기' 3행이 섞여 있다. 원인: RegionEnsure::fromKakao 가 카카오 주소의 시·도 이름을 그대로 INSERT, findExisting 도 글자 그대로 비교.
- 사용자 승인(2026-10-08): RegionAlias 를 지우지 말고 RegionEnsure 에서 재사용해 새 지역 행 저장·조회 시 시·도 이름을 정식 이름으로 맞춘다. 운영 DB 의 '경기'→'경기도' UPDATE 는 사용자가 코드 배포 **뒤에** phpMyAdmin 에서 실행한다. 새 코드는 DB 정리 전·후 모두 안전해야 한다.
- 참고: 다른 브랜치 '찾기 주소 통일'(`origin/cursor/hold-find-address-merge-verify-20261008`)이 AddressRegionMatch.php(현재 RegionAlias 의 다른 사용처)를 삭제한다.

## 할 일
1. RegionAlias SIDO_MAP 가 정식명 17개와 일치하는지 확인: 서울특별시, 부산광역시, 대구광역시, 인천광역시, 광주광역시, 대전광역시, 울산광역시, 세종특별자치시, 경기도, 강원특별자치도, 충청북도, 충청남도, 전북특별자치도, 전라남도, 경상북도, 경상남도, 제주특별자치도. 옛 이름('강원도'→'강원특별자치도', '전라북도'→'전북특별자치도') 포함. 광주: '광주'→'광주광역시' 매핑이 경기도 광주시(시군구)와 혼동되지 않는지 확인 — canonicalSido 는 시·도 칸 값에만 쓰이므로 문제 없는지 호출처를 보고 보고.
2. 기존 사용처 영향: canonicalSido 의 반환이 넓어졌다(예전에는 서울만 변환). AddressRegionMatch.php 등 다른 호출처가 이 변화로 동작이 바뀌는지 `git grep -n canonicalSido` 로 확인하고 영향 보고(파일 수정은 하지 말 것).
3. RegionEnsure: findExisting 의 dong_code 폴백 로직·'시 대표' 제외 조건 유지, 반환 라벨(hydrate)은 DB 값 기준 유지인지 확인.
4. `scripts/verify-region-sido-canonical.mjs` 작성(다른 verify 스크립트처럼 소스 문자열 assert): (a) RegionEnsure 가 RegionAlias::canonicalSido 사용, (b) insertRow 호출에 정규화 값, (c) findExisting 이 `sido_name IN (?, ?)`, (d) SIDO_MAP 에 17개 정식명이 값으로 있고 '경기'→'경기도', '강원도'→'강원특별자치도', '전라북도'→'전북특별자치도', (e) '시 대표' 제외 유지. package.json 에 verify 등록 관례가 있으면 따르고 없으면 등록하지 않는다.
5. 실행: 새 verify, `scripts/verify-study-room-basic-register-api.mjs`, scripts/ 에서 이름에 region 이 들어간 verify 전부(vite-node 가 필요한 것은 `cd preview/home-ui; npx vite-node ../../scripts/<파일>`), `.github/workflows/deploy.yml` 배포 전 게이트 전부. node_modules 없으면 `npm ci`. PHP 는 이 PC 에 없다 — '미실행(php 없음)' 명시. `npm run build:dothome` 성공 확인(바뀐 추적 파일은 `git checkout --`, 산출물 커밋 금지).
6. 충돌 검사: 커밋 후 `git merge-tree --write-tree origin/cursor/hold-find-address-merge-verify-20261008 HEAD` 결과(충돌 여부).
7. 기록: `docs/worklog/2026/10/2026-10-08-region-sido-canonical.md` — '지시서 원문' 절에 이 메시지 전체, 바꾼 파일, 매핑 확인 결과, canonicalSido 호출처 영향, 검사 결과 표, '배포 후 사용자 할 일: 코드 배포 뒤 운영 DB 에서 SELECT 확인 후 UPDATE regions SET sido_name='경기도' WHERE sido_name='경기' (배포 전에 실행하면 옛 코드가 줄임말 행을 다시 만들 수 있음)'. 검수·승인 '대기'.
8. 허용 파일만 개별 git add → commit (예: `fix(region): 새 지역 행의 시·도 이름을 정식 이름으로 맞춘다`) → `git push -u origin cursor/region-sido-canonical-20261008`.

## 최종 보고 (메인에게)
- 커밋 hash 전체, push 여부, 바꾼 파일·diff 줄 수
- 매핑 확인 결과(누락·불일치), canonicalSido 호출처 영향
- 검사 결과 표, 빌드 결과, merge-tree 결과
- `git status --short`
```

---

## 2. 바꾼 파일

1. `src/Region/RegionAlias.php` (수정)
   - `SIDO_MAP` 상수(17개 시도 정식명 및 줄임말/옛 이름 매핑) 추가
   - `canonicalSido()`가 `SIDO_MAP`을 참조하여 시도명을 정식 명칭으로 정규화하도록 확장
2. `src/Region/RegionEnsure.php` (수정)
   - `fromKakao`에서 `RegionAlias::canonicalSido($sido)`로 정규화된 시도명 생성
   - `insertRow` 호출 시 정규화된 `$canonicalSido` 전달
   - `findExisting`에 정규화된 `$canonicalSido`와 원본 `$rawSido`를 전달하여 `sido_name IN (?, ?)`로 조회 (DB 업데이트 전후 모두 매칭 가능)
3. `scripts/verify-region-sido-canonical.mjs` (신규 작성)
   - (a) RegionEnsure 의 RegionAlias::canonicalSido 사용 검증
   - (b) insertRow 호출 시 정규화 값 전달 검증
   - (c) findExisting 의 `sido_name IN (?, ?)` 바인딩 검증
   - (d) SIDO_MAP 내 17개 정식명 및 경기/강원도/전라북도 매핑 검증
   - (e) '시 대표' 제외 조건 유지 검증
4. `docs/worklog/2026/10/2026-10-08-region-sido-canonical.md` (신규 작성)
   - 작업 지시서 원문, 분석 결과, 검사 결과 표, 배포 후 작업 기록

---

## 3. 매핑 확인 결과 (누락·불일치 및 혼동 검토)

- **17개 정식명 일치 여부**:
  - `SIDO_MAP`의 매핑 대상 값(고유 집합): 서울특별시, 부산광역시, 대구광역시, 인천광역시, 광주광역시, 대전광역시, 울산광역시, 세종특별자치시, 경기도, 강원특별자치도, 충청북도, 충청남도, 전북특별자치도, 전라남도, 경상북도, 경상남도, 제주특별자치도 (정확히 17개, 누락 없음)
- **옛 행정구역 명칭 매핑 포함**:
  - `'강원도' => '강원특별자치도'` 매핑 포함 확인
  - `'전라북도' => '전북특별자치도'` 매핑 포함 확인
- **광주광역시 vs 경기도 광주시 혼동 여부 검토**:
  - `RegionAlias::canonicalSido()`는 카카오 우편번호 결과의 `sido` / `address_sido` 필드에 대해서만 호출된다.
  - 경기도 광주시의 경우: 카카오 결과에서 `sido`는 `'경기'` 또는 `'경기도'`이고, `sigungu`가 `'광주시'`이다.
  - 따라서 `canonicalSido`에는 `'경기'` 또는 `'경기도'`가 전달되므로 경기도 광주시(시군구)와 광주광역시(시도)가 혼동될 여지가 전혀 없다.

---

## 4. canonicalSido 호출처 영향

- `git grep -n canonicalSido` 확인 결과 호출처:
  1. `src/Region/RegionEnsure.php`: 신규 반영처로, 카카오 주소 검색 결과의 시도명을 정규화하여 DB 조회(`findExisting`) 및 삽입(`insertRow`)에 사용.
  2. `src/Region/AddressRegionMatch.php`:
     - `compactSido()` 내부에서 `RegionAlias::canonicalSido($value)` 호출 후 접미사(특별시/광역시/특별자치시/특별자치도/자치도/도) 제거 정규식을 적용.
     - 이전에는 서울만 정식명으로 변환하고 나머지는 그대로 반환했으나 이후 접미사 제거를 통해 대부분 동일하게 처리되었음.
     - 특히 '전라북도'의 경우 기존에는 '전라북'으로 축약되어 '전북특별자치도'('전북')와 불일치할 가능성이 있었으나, 정식명 변환 도입으로 '전북특별자치도' -> '전북'으로 안전하게 일치됨.
     - 따라서 부정적인 영향이 전혀 없으며 매칭 일관성이 개선됨.
     - 또한 참고사항에 명시된 대로 다른 브랜치(`origin/cursor/hold-find-address-merge-verify-20261008`)에서 `AddressRegionMatch.php`는 삭제될 예정임.

---

## 5. RegionEnsure 점검 결과

1. **dong_code 폴백 로직**:
   - `findExisting`의 1차 조건(동 이름 및 시도 매칭) 실패 시, `dongCode !== ''`일 때 `WHERE dong_code = ? AND dong_name = ? AND is_active = 1 AND unit_level = 'dong' AND dong_name <> '시 대표'`로 fallback 조회하는 로직이 온전히 유지됨.
2. **'시 대표' 제외 조건**:
   - 1차 조회 SQL의 `AND dong_name <> '시 대표'` 유지.
   - fallback 조회 SQL의 `AND dong_name <> '시 대표'` 유지.
   - fallback 조회 후 PHP 레벨의 `(string) ($row['dong_name'] ?? '') !== '시 대표'` 가드 유지.
   - `dongNameFromKakao()` 내 `if ($dong === '시 대표') return '';` 가드 유지.
3. **반환 라벨(hydrate)**:
   - `hydrate()` 함수는 DB에서 조회된 레코드(`$row['sido_name']`, `$row['sigungu_name']`, `$row['dong_name']`)를 기반으로 `$sido . ' ' . $sigungu . ' ' . $dong` 라벨을 생성하여 반환하므로 DB 값 기준이 온전히 유지됨.

---

## 6. 검사 결과 표

| 검사 대상 | 실행 명령 | 결과 | 세부 내용 / 비고 |
|---|---|:---:|---|
| 새 검증 스크립트 | `node scripts/verify-region-sido-canonical.mjs` | **PASS** | (a)~(e) 20개 assertion 전체 통과 |
| 공부방 기본등록 API 검증 | `npx --yes vite-node scripts/verify-study-room-basic-register-api.mjs` | FAIL | 4건 실패 (duplicate study_room 문구, complete go-home 문구, 홍보지역 문구, mypage overview 2·3 미표시). 이 스크립트는 BasicRegisterService.php·signup-complete.js·step-basic.js 등만 읽고 본 티켓 수정 파일을 읽지 않으므로 기반 `b249ccc`에서도 같은 결과로 판단(기반 커밋에서 직접 재실행은 하지 않음). 원인 미조사 |
| 계정 카드 대표 지역 검증 | `cd preview/home-ui; npx vite-node ../../scripts/verify-mypage-account-region.mjs` | **PASS** | 41 passed, 0 failed |
| 포지션 지역 티어 검증 | `cd preview/home-ui; npx vite-node ../../scripts/verify-position-region-tier.mjs` | **PASS** | 19 passed, 0 failed |
| 지역 저장 규칙 검증 | `cd preview/home-ui; npx vite-node ../../scripts/verify-region-save-rules.mjs` | **PASS** | 46 passed, 0 failed |
| 학생 마이페이지 희망지역 검증 | `cd preview/home-ui; npx vite-node ../../scripts/verify-student-mypage-hope-region.mjs` | **PASS** | 70 passed, 0 failed |
| 과외쌤 지역 라벨 검증 | `node scripts/verify-tutor-region-label.mjs` | **PASS** | 103 passed, 0 failed |
| 픽 지역 소유권 검증 (PHP) | `scripts/verify-pick-region-ownership.php` | - | 미실행 (php 없음) |
| 포지션 지역 티어 검증 (PHP) | `scripts/verify-position-region-tier.php` | - | 미실행 (php 없음) |
| 프라임 지역 소유권 검증 (PHP) | `scripts/verify-prime-region-ownership.php` | - | 미실행 (php 없음) |
| 공부방 홍보지역 매칭 (PHP) | `scripts/verify-room-promo-region-match.php` | - | 미실행 (php 없음) |
| **deploy.yml 게이트**: ShopPage | `npm run verify:shop-page` | **PASS** | 54 passed, 0 fail |
| **deploy.yml 게이트**: 비밀값 검사 | `bash scripts/check-no-committed-secrets.sh` | **PASS** | 커밋된 OAuth/운영 비밀값 검사 통과 |
| **deploy.yml 게이트**: 과외 쪽지설정 | `npm run verify:tutor-inquiries-settings` | **PASS** | tutor inquiries settings OK |
| **deploy.yml 게이트**: 공부방 쪽지샘플 | `npm run verify:study-room-inquiries-samples` | **PASS** | study-room inquiries samples OK |
| **deploy.yml 게이트**: 064 DDL 존재 | `Test-Path sql/schema/064_tutor_inquiry_status.sql` | **PASS** | 파일 존재 확인 (True) |
| **deploy.yml 게이트**: Board ACL (JS) | `npm run verify:board-acl:js` | **PASS** | board-channel-acl verify ok |
| **deploy.yml 게이트**: Board ACL (PHP) | `php scripts/verify-board-channel-acl.php` 등 | - | 미실행 (php 없음) |
| 닷홈 빌드 검증 | `npm run build:dothome` | **PASS** | 빌드 성공, 바뀐 추적 파일 없음, 빌드 산출물 커밋 제외 확인 |

---

## 7. 배포 후 사용자 할 일

> **배포 후 사용자 할 일**:
> 코드 배포 뒤 운영 DB 에서 SELECT 확인 후
> `UPDATE regions SET sido_name='경기도' WHERE sido_name='경기'`
> (배포 전에 실행하면 옛 코드가 줄임말 행을 다시 만들 수 있음)

---

## 8. 충돌 검사 결과 (`git merge-tree`)

- 기준 커밋: `origin/cursor/hold-find-address-merge-verify-20261008`
- 대상: 본 커밋 HEAD
- 검사 커밋: `043caf17b9c7be822ab3942463e0f3fbc2b1b15c`
- 명령: `git merge-tree --write-tree origin/cursor/hold-find-address-merge-verify-20261008 HEAD`
- 결과: exit 0, 트리 `48cac76d8b78da31f37ae20030154f502acf5630` — **충돌 없음**

---

## 9. 검수 및 승인 기록

- 작업 세션: Cursor Subagent
- 검수 (2026-10-08 07:05, Cursor 메인 에이전트, 작업 세션과 별개): **통과** — 대상 `043caf1`
  - `RegionAlias::SIDO_MAP` 17개 정식명·옛 이름(강원도·전라북도) 확인. `RegionEnsure`: 새 행은 정식명으로 INSERT, 조회는 `sido_name IN (정식명, 원래값)`이라 DB 정리 전(「경기」 3행)·후 모두 기존 행을 찾음. `dong_code` 폴백·「시 대표」 제외·hydrate(DB 값 기준) 유지
  - 시군구 연결(`RegionGuLink`)은 이미 여러 시·도 표기를 허용(`sido_name IN (:sido_a, :sido_b, :sido_c)`)해 영향 없음. `AddressRegionMatch`는 주소 통일 배포 때 삭제됨
  - `verify-study-room-basic-register-api.mjs` 4건 실패는 메인이 수정 전(`b249ccc` 기준 worktree)에서 같은 4건 재현 → **기존 실패, 이 작업과 무관**(CI 게이트 아님). 별도 정리 과제로 보고
  - 주소 통일 브랜치와 merge-tree 충돌 0
- 승인: 사용자 위임 (2026-10-08 04:17 「배포까지 승인하겠다. 무결성은 제외.」) — `main` push는 Cursor 자동 검토가 사용자 승인 카드를 요구해 기상 후 배포
- **DB 순서:** 코드 배포 → 사용자가 SELECT 확인 후 `UPDATE regions SET sido_name='경기도' WHERE sido_name='경기'` (배포 전 UPDATE 금지)
