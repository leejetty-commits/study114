# 344 — CI 「PHP 8.2 Resend gate」 tutorUnits 문자열 검사 오탐 수정

**브랜치:** `work/344-ci-resend-gate-regions`  
**기준:** `origin/main` (`e49031cb` · 342 merge)  
**일시:** 2026-11-10  
**작업 폴더:** `D:\work\study114\.wt\work-344-ci-resend-gate-regions`

## 지시 요점

- 343에서 tutorUnits 매핑이 `preview/auth-ui/src/auth-api.js` → `preview/shared/regions-catalog.js`로 옮겨져 Resend gate가 오탐 실패하는 것을 바로잡음.
- 검사 의도(매핑이 사라지면 실패) 유지. 검사 삭제·약화·skip 금지.
- 앱 코드(`preview/`·`public/`) 수정 금지.

---

## 1. 게이트 원래 검사 내용 (원문)

**워크플로:** `.github/workflows/cur-006-resend.yml`  
**Job 이름:** `PHP 8.2 Resend gate` (`php82-mail-gate`)  
**해당 단계:**

```yaml
- name: Tutor signup seed regions
  run: npm run verify:tutor-signup-seed
```

**실제 문자열 검사 위치:** `scripts/verify-tutor-signup-seed.mjs` (YAML에 인라인 grep 없음)

**수정 전 원문:**

```js
const api = readFileSync(resolve(root, 'preview/auth-ui/src/auth-api.js'), 'utf8');
assert(api.includes('tutorUnits: data.tutor_units'), 'fetchRegions returns tutor units');
```

| 항목 | 값 |
|------|-----|
| 파일 | `preview/auth-ui/src/auth-api.js` **만** |
| 찾는 문자열 | `tutorUnits: data.tutor_units` |
| 실패 메시지 | `fetchRegions returns tutor units` |

**343 이후 실제 코드:**

- `auth-api.js`: `fetchRegions()` → `fetchRegionsCatalog()` 위임. 위 문자열 **없음**.
- `regions-catalog.js` `normalizeCatalog`:  
  `tutorUnits: Array.isArray(body.tutor_units) ? body.tutor_units : …`  
  → 구 문자열 `tutorUnits: data.tutor_units` **없음**. 신 형태만 존재.

→ 파일만 추가하고 구 문자열만 보면 여전히 실패. 구·신 매핑 형태를 모두 인정하고, **두 파일 중 하나**에 있으면 통과.

---

## 2. 변경

**파일:** `scripts/verify-tutor-signup-seed.mjs`만.

- 검사 대상: `auth-api.js` **+** `regions-catalog.js`
- 통과 조건: 둘 중 하나에 아래 중 하나라도 있으면 PASS  
  - `tutorUnits: data.tutor_units` (343 이전)  
  - `tutorUnits: Array.isArray(body.tutor_units)` (343 이후)
- 둘 다 없으면 FAIL (의도 유지)
- 다른 assert·다른 CI 단계·앱 코드 변경 없음

---

## 3. 로컬 확인

### 통과 (수정 후)

```
PASS: fetchRegions returns tutor units (auth-api.js or regions-catalog.js)
…
tutor signup seed gate OK
```

### 실패 재현 (커밋 안 함)

`regions-catalog.js`의 `tutorUnits: Array.isArray(body.tutor_units) ? body.tutor_units : …` 를 `tutorUnits: []` 로 잠깐 치환:

```
FAIL: fetchRegions returns tutor units (auth-api.js or regions-catalog.js)
tutor signup seed gate FAILED (1)
```

원상복구 후 재실행 → PASS · `needle_back` 확인. `regions-catalog.js`는 커밋에 포함하지 않음.

---

## 4. Git / PR / 머지

| 항목 | 값 |
|------|-----|
| 커밋 | `d8f7d789` |
| PR | https://github.com/leejetty-commits/study114/pull/156 |
| CI 「PHP 8.2 Resend gate」 | ✅ success (Tutor signup seed regions 포함 전 단계 success) |
| 머지 커밋 | `1e1e9958` |

---

## 금지 준수

- `preview/`·`public/` 미수정
- 검사 삭제·`continue-on-error`·skip 없음
- force push / `reset --hard` / `stash drop` 없음
- 비밀값 기록 없음
