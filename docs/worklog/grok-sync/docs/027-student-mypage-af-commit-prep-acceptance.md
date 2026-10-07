# 027 · 티켓 H 수락 — A~F(+G) 커밋 분리·배포 준비

- 작성일: 2026-09-24 (KST)
- 기준: [025](025-student-mypage-af-commit-deploy-prep.md)
- 선행: G 수락 [026](026-student-mypage-memo-settings-acceptance.md)
- 상태: **로컬 수락 (준비 완료)** — 커밋·push·`build:dothome` **미실행** (올바름)

---

## 0. 판정

**수락.** 025 산출물(분류 · stage 제안 · 스모크 · 메시지 초안 · 안 한 것) 충족.  
보완지시 없음. **다음 게이트는 사용자 「커밋해」.**

---

## 1. 분류 잠금 (이번 커밋에 쓸 것)

### 1-1. mypage stage 제안 = 이 묶음만 (실행은 「커밋해」 후)

| 경로 | 비고 |
|------|------|
| `preview/home-ui/src/student-reg/**` | 삭제 `hope-regions-ui.js`, 미추적 `profile-read.js` 포함 |
| `preview/home-ui/src/mypage/{index,preview-data,router,screens,shell}.js` | hub A |
| `preview/home-ui/src/empty-state-copy.js` | |
| `preview/home-ui/src/exposure-render.js` | |
| `preview/home-ui/src/main.js` | Stage5B CSS import **2줄만** |
| `preview/home-ui/src/styles/student-detail.css` | hint 12px · `#4B5563`만 |
| `preview/home-ui/src/styles/student-mypage-stage5b.css` | 미추적 · 포함 |
| `src/Registration/StudentHubRepository.php` | 지역·과목·요청문·예산·`memo_status` open\|paused |

파일 단위 `git add`로 충분. **`-p` 불필요** (mypage↔auth 한 파일 혼합 없음).

### 1-2. 같은 커밋에 넣지 말 것

| 묶음 | 경로 |
|------|------|
| **auth** | `preview/auth-ui/**`, `public/assets/css/auth/mvc.css`, 미추적 `preview/auth-ui/src/styles/student-basic.css`, `src/Auth/BasicRegisterService.php`, `src/Views/auth/**`, `src/helpers.php`(칩 required) |
| **other** | `study-room-reg/screens.js` 끝 빈 줄, `.tmp-*`, `*/_verify/`, `public/assets/teaser-*.js` |
| **학생찾기** | `c49b09a` 파일 **이 WT에 없음** → H/이번 커밋과 무관 |

`GUARDIAN_*` 개명 · dead publish 삭제: **제외 유지** (비차단).

---

## 2. 스모크 (보고 수락)

| 항목 | 결과 |
|------|------|
| 마이프로필 · 기본 · 상세 | 열림 |
| 목록 · tab/draft · publish → `#/mypage/registrations/students/1` | 예 |
| 찜·비교 · 쪽지 · 계정설정 · 좌측 메뉴 | 예 |
| 쪽지설정 open→paused→open · GET open | 예 |
| 과외쌤 `#/mypage` 좌측·제목 | 예 |
| 비회원 홈 열림 · 가입 링크 `#/signup/terms` | 예 |
| 가입 화면 **안쪽** | **미완** — `127.0.0.1:5173` 무응답. H 준비 비차단(auth WIP는 커밋 밖). 「커밋해」 전 또는 배포 전 5173 살아 있으면 한 번만 추가 확인 권장 |
| 공부방 `#/mypage` 좌측 | 보고에 **명시 없음**. 「커밋해」 직전 한 줄 스모크 권장(비차단) |

---

## 3. 커밋 메시지 초안 (잠금)

```
feat(student-mypage): A–F hub/profile/forms + Stage5B; G memo_status (open|paused)
```

실행·push·build: **아직 금지.** 사용자 명시 단어만.

---

## 4. 안 한 것 (올바름)

push · `build:dothome` · 배포 · `git add` · 커밋 · auth 혼합 · 학생찾기 · GUARDIAN/dead publish.

---

## 5. 다음

1. 사용자 **「커밋해」** → 위 1-1만 stage → 메시지 3절 → 로컬 커밋만  
2. **「푸시해」** → remote  
3. **「빌드해」/「배포해」** → `build:dothome` + 운영 스모크  
4. 학생찾기 · auth는 **별 커밋/별 티켓**


---

## 6. 배포 게이트 (갱신 2026-09-24)

사용자가 Cursor에 **배포 일괄** 지시문을 전달함.
운영 점검은 [028](028-student-mypage-afg-deploy-ops-checklist.md).
커밋 hash·build 결과는 Cursor 보고 후 028 §2에 기입.
