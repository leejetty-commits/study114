# 042 · 배포 판정 — 가입 QA(030~040) vs dirty WIP

- 작성일: 2026-09-24 (KST)
- 기준 커밋: `20b7be8` (= `origin/main` · 이미 닷홈 배포됨 · Actions #324)
- 브랜치: `feat/student-mypage-a-g` · HEAD와 main **동일** · **미푸시 커밋 0**
- 상태: **지금 워킹트리 통째 배포 = 불가** · 실행 티켓 → [043](043-signup-qa-allowlist-deploy-ticket.md)

---

## 0. 한 줄 판정

**지금 당장「배포해」로 dirty 전체를 올리면 안 된다.**  
학생 기본등록 PHP/CSS·auth shell WIP가 수락 가입 수정과 한 트리에 섞여 있다.  
**수락 allowlist만** 스테이징·커밋·푸시·`build:dothome` 하면 그다음에 **예**.

재배포만(커밋 없이) 하면 `20b7be8` 그대로라 **변화 없음**.

---

## 1. 현재 트리

| 구분 | 내용 |
|------|------|
| 운영 | mypage A~F+G 이미 배포 (`20b7be8`) |
| 미커밋 | 15 modified · +659/−85 + untracked(`.tmp*` · `_verify` · `teaser-*` · `student-basic.css`) |
| 위험 | `BasicRegisterService.php`(+131) · `basic-student.php` · `mvc.css` · `signup-basic.js`에 학생 WIP 혼재 |

---

## 2. 파일 분류

### A. 로컬 수락 · 배포 후보 (가입 QA)

| 파일 | 티켓 |
|------|------|
| `preview/shared/korea-sidos.js` | 030/032 |
| `preview/auth-ui/src/screens/signup-complete.js` | 033~036 |
| `preview/study-room-ui/src/main.js` | 035/036 |
| `preview/study-room-ui/src/screens/step-lesson.js` | 039 |
| `preview/study-room-ui/src/screens/step-facility.js` | 039 |
| `preview/shared/study-room-basic-form.js` | 040/041 |

### B. 혼재 · 조심 (030 일부 + 미수락 학생 WIP)

| 파일 | 메모 |
|------|------|
| `preview/auth-ui/src/screens/signup-basic.js` | `regionIdFromActivityLabel`(030) + `SCHOOL_LEVEL`/`request_summary`(학생·미검수 배포 금지). **허크 분리 또는 030 줄만** 스테이징 |

### C. 배포 금지 (미수락 / 노이즈)

- `src/Auth/BasicRegisterService.php`
- `src/Views/auth/partials/basic-student.php` · `signup-basic.php`
- `public/assets/css/auth/mvc.css` · `preview/auth-ui/src/styles/student-basic.css`(untracked)
- `preview/auth-ui/src/layout.js`(`cardClass`) · `main.js`(`student-basic.css` import)
- `src/helpers.php`(`required` 인자)
- `preview/home-ui/src/study-room-reg/screens.js`(개행만)
- `.tmp-*` · `_verify/` · `public/assets/teaser-*`

---

## 3. 배포 가능 조건 (체크리스트)

1. C군·untracked **절대 스테이징 금지**
2. A군 전부 + B군은 **030 관련 hunk만** (학생 필드 hunk 제외)
3. 커밋 메시지: 가입 QA 030~040만 명시 · mypage와 섞지 않음
4. push → `build:dothome` / Actions 성공 확인
5. 스모크: 과외 시·군(의정부) · 완료화면 디버그 칸 없음 · 상세 같은 탭 · 상세 카피 · 공부방 개설→홍보1
6. 학부모 mypage 028 §3은 **이번 묶음과 무관** (이미 배포분)

---

## 4. 결론 표

| 질문 | 답 |
|------|-----|
| 지금 dirty 통째 배포? | **아니오** |
| 커밋 없이 재배포? | **무의미** (이미 `20b7be8`) |
| 수락 allowlist만 커밋 후 배포? | **예** (B hunk 분리 전제) |
| 학생 기본 PHP/CSS까지? | **아니오** — 별도 티켓·수락 후 |

명시 단어(`커밋해`/`푸시해`/`빌드해`/`배포해`) 오기 전에는 실행하지 않음.
