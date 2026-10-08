# 024 · 학생 마이페이지 G — 쪽지설정 저장 (`memo_status`)

- 작성일: 2026-09-24 (KST)
- 선행: [023](023-post-af-remaining-work-master.md) · A~F 로컬 수락 (022)
- 정본: 노션 학생 마이페이지 구조 §4-2(쪽지설정 탭) · 15장(쪽지설정=문의 수신) · A 수락 010 §4-3
- 상태: **로컬 수락** — 수락 [026](026-student-mypage-memo-settings-acceptance.md). 안 받음=`paused`(closed 없음).

---

## 0. 한 줄 목적

학생 **쪽지설정** 탭에서 `memo_status`(쪽지 수신 on/off)를 **저장**할 수 있게 한다.  
조회는 이미 되고 라디오가 disabled인 상태다. **enable + 기존 PATCH update allowlist에 `memo_status` 추가**가 핵심이다.  
기본정보·상세·마이프로필·IA·Stage5B·auth **재설계 금지.**

---

## 1. 컨텍스트

| 항목 | 사실 |
|------|------|
| 탭 경로 | `#/mypage/registrations/students/{id}/settings` (쪽지설정) |
| 데이터 | 활성 학생 id=**1**. GET 시 `memo_status=open` 관측됨 (A) |
| A~F | 쪽지설정은 **표시만**. 저장 버튼 없음 / 라디오 disabled |
| PHP | 학생 `PATCH …/students.php` `action: update` allowlist에 **`memo_status` 없음** → 프론트만 켜면 거절됨 |

예상 값(코드로 재확인 후 보고에 적을 것): `open` = 쪽지 받는 중, `closed`(또는 동등 enum) = 안 받음. **DB에 이미 있는 enum만** 사용. 새 컬럼·마이그레이션 금지.

---

## 2. 범위

### 2-1. 포함

| 파일(원칙) | 허용 |
|------------|------|
| `preview/home-ui/src/student-reg/screens.js` (또는 settings 렌더가 있는 파일) | 라디오 enable · 저장 UI · `data-p19-form`/submit → 기존 update에 `memo_status` 포함 |
| `src/Registration/StudentHubRepository.php` (또는 students update allowlist 실파일) | update allowlist에 `memo_status` **최소 추가** · 허용 값 검증 |
| 필요 최소 카피/라벨 | 「쪽지 받는 중」/「안 받음」 등 **기존 카피 유지·연결만**. 전면 카피 리라이트 금지 |

작업 전: `memo_status` · settings · 쪽지설정 검색 목록을 보고에 적고 **그 파일만**. 밖이면 중단·보고·승인 대기.

### 2-2. 제외 (= 거부)

1. 기본정보 9종 · 상세 9종 · 마이프로필 카드/리스트 재설계
2. 쪽지 **함**(받은/보낸 목록) 리뉴얼 · 쪽지 전송 API
3. 계정설정 전화번호·재검증
4. 스키마 변경 · 새 테이블 · 새 엔드포인트 (기존 PATCH update만)
5. auth/signup WIP와 커밋 혼합
6. push / `build:dothome` (G에서 금지. 배포는 025+명시 지시)
7. Stage5B 전면 재작업 (기존 클래스 유지. 저장 버튼만 Primary `#266BC4`면 충분)
8. 자녀/게이트/스테퍼 재도입
9. 공부방·과외쌤 쪽지설정 전면

---

## 3. UX·카피 잠금

- 탭 제목: **쪽지설정** (공개설정 부활 금지)
- 목적: **문의(쪽지) 수신 on/off**만. 공개·검수·필수와 무관
- 저장 성공 후: 같은 탭에서 선택값 유지 · 새로고침 후에도 GET 값과 일치
- 「필수」「부족」「공개 전」문구 **금지**
- 저장 실패 시: 기존 폼 오류 패턴 재사용. 조용히 무시 금지

---

## 4. API 잠금

- 메서드: 기존 `PATCH /api/registrations/students.php` `action: update`
- 바디에 `memo_status` 포함 (id=1)
- allowlist + 서버 허용 enum만. 스키마 ALTER 금지
- `request_summary` / `special_request_note` 등 **다른 필드 회귀 없음** (스모크)

---

## 5. 완료 전 필수 점검

1. `#/mypage/registrations/students/1/settings` 진입·새로고침
2. 라디오 선택 가능 · **저장 버튼 동작**
3. `open` → 저장 → GET/새로고침 일치 → `closed`(또는 코드 enum) → 저장 → 일치 → **원래 값으로 원복**
4. basic `request_summary` · detail `special_request_note` 각 1회 스모크(회귀) 후 원복
5. 마이프로필·기본·상세 라우팅 정상 · 금지어 0
6. 변경 파일 목록 + allowlist diff 한 줄 · auth 파일 **미포함**

예상외면 중단·보고·승인 대기.

---

## 6. 산출물

1. 검색 목록 · 변경 파일+이유  
2. 허용 `memo_status` 값 목록(코드/DB 근거)  
3. 저장 전후 API 증거 · 원복  
4. 「안 한 것」  
5. 로컬만. 커밋/푸시/빌드 금지  

---

## 7. Cursor 복사용

```
023 잔여 1번. 024 티켓 G만. 학생 쪽지설정 memo_status 저장.

【목적】
쪽지설정 탭에서 memo_status(쪽지 수신 on/off) 저장.
라디오 enable + 기존 PATCH students.php action:update allowlist에 memo_status 최소 추가.
A~F 폼/카드/IA/디자인 재설계 금지.

【포함】
- student-reg settings UI (disabled 해제·저장)
- StudentHubRepository(또는 실 allowlist)에 memo_status + enum 검증
- 작업 전 검색 목록 → 그 파일만

【제외 = 거부】
기본/상세/마이프로필 재설계, 쪽지함 리뉴얼, 계정설정, 스키마·새 API,
auth WIP 혼합, push/build:dothome, Stage5B 전면, 타역할 쪽지설정 전면,
자녀·게이트 재도입.

【잠금】
탭=쪽지설정. 공개설정 부활 금지. DB 기존 enum만. id=1 저장↔새로고침 일치 후 원복.
basic/detail 저장 회귀 스모크. Primary 저장 버튼만.

【필수 종료】
파일목록 + allowlist + 저장 증거/원복 + 라우팅 + 금지어0.
예상외면 중단·보고·승인 대기.
```
