# [311] 학생(parent) 홈 티어 구분선 제거 + 여백 게스트와 통일

- **작성**: Cursor 메인 에이전트
- **RESTORE_BASE**: `53eb5241a99faa4ba58f14a75ff161d7d97887e2`
- **브랜치**: `cursor/311-parent-home-tier-lines-20261027`

---

## 지시서 원문 (요약)

- 종현 t477 「전체 통일하자. 라인 빼자」 · t478 「여백간의 통일감은 줘야해」
- 학생 홈 「우리동네 과외쌤」 프라임·픽·베이직 사이 가로 구분선 제거
- 티어 사이 세로 여백을 게스트 홈(310)과 같은 `var(--space-8)` (32px)로 통일

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `preview/home-ui/src/styles/home-listings.css` | parent 티어 블록: border-top 삭제, margin-top:0, --tier-section-gap → var(--space-8) |

---

## 제거한 border 선택자

```
.home-shell--parent .content-section--blue .list-subsection .section-heading--pick
.home-shell--parent .content-section--blue .list-subsection > .section-title-bar--basic
```

두 규칙 모두 `border-top: 1px solid var(--gray-200)` 삭제.

---

## 여백 실측 (Before → After)

### 학생 홈 pick 과외쌤 heading

| 속성 | Before | After | 목표 |
|------|--------|-------|------|
| --tier-section-gap | 2rem | var(--space-8) = 2rem | var(--space-8) |
| margin-top | 32px (2rem) | 0px | 0 |
| border-top | 0.8px solid gray | none | 없음 |
| padding-top | 32px (2rem) | 32px (var(--space-8)) | var(--space-8) |
| **합계** | **~65px** | **32px** | **게스트와 동일 32px** |

### 게스트 섹션 heading (310 정본, 회귀 확인)

| 속성 | Before CSS 변경 | After CSS 변경 |
|------|-----------------|----------------|
| padding-top | 32px | 32px (변화 없음 ✅) |
| margin-top | 0px | 0px (변화 없음 ✅) |
| border-top | none | none (변화 없음 ✅) |

**게스트 회귀 = 0** ✅

### 프라임 과외쌤 첫 제목 위 여백

프라임 과외쌤 heading: paddingTop=32px, marginTop=0px (parent shell에서도 게스트와 동일). 이는 310에서 적용한 게스트 base 규칙이 공유되기 때문. parent 스코프 override 없이도 같은 값. ✅

---

## dirty / stash

- 오너 dirty 파일: 그대로 유지 (commit/restore/clean 하지 않음)
- stash: 기존 stash@{0}~stash@{9} 유지, 새 stash 없음

---

## 스크린샷

| 유형 | 경로 |
|------|------|
| Before 전체 (1440px, parent shell) | `docs/worklog/2026/10/shots-311/before/parent-fullpage-1440-before.png` |
| After 전체 (1440px, parent shell) | `docs/worklog/2026/10/shots-311/after/parent-fullpage-1440-after.png` |

※ 로컬에서는 학생 홈 로그인 불가로, guest DOM에 class override로 촬영.
※ 실제 운영 확인은 배포 후 로그인 상태에서 수행 필요.

---

## 복원

```bash
# CSS 원복
git restore --source=HEAD -- preview/home-ui/src/styles/home-listings.css

# 잘못된 커밋 전체 원복 (push 전)
git reset --hard 53eb5241a99faa4ba58f14a75ff161d7d97887e2

# push 후 force 금지 → -r2 또는 보고
```

---

## 빌드

- `npm run build` (preview/home-ui): 통과 ✅
- pageerror: 확인 불가 (로컬 로그인 없음)

---

## 셀프 승인: 안 함
## merge / deploy: 안 함
