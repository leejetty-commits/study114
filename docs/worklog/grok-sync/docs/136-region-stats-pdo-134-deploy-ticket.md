# 136 · 배포 — PDO 이름 분리 (134 · db4cde2)

- 작성: 2026-09-25 05:26 KST
- 사용자 허가: 「배포」(위젯 · 2026-09-25) → push · Actions **Deploy to dothome** **허가**
- 로컬 수락: [135](135-region-stats-pdo-134-acceptance.md)
- 현재: `origin/main` = `fb3bbf5` · 로컬 HEAD = `db4cde2` · ahead 1
- **새 커밋·새 stage 없음.** `git add` 금지. force 금지.
- DB 마이그레이션 **없음**
- 배포 결과: **조건부 수락** → [137](137-region-stats-pdo-136-deploy-acceptance.md) · #337 · 과외는 [138](138-tutor-region-like-drop-label-fixup.md)

---

## 0. 한 줄

로컬 커밋 **`db4cde2` 하나만** `origin/main`에 fast-forward push → Deploy to dothome.  
파일 1개: `src/Search/SearchService.php`. dirty 잔여 건드리지 말 것.

---

## 1. 게이트

1. `git fetch origin`
2. `origin/main` == `fb3bbf531917d1d49c2d671971be500f5f964602` 아니면 중단
3. `HEAD` == `db4cde227b030b195a723c7ae7811302694dabe9` 아니면 중단
4. `git log --oneline origin/main..HEAD` = 정확히 1줄:  
   `db4cde2 fix(search): give each region LIKE placeholder its own PDO name`
5. `git diff --name-only origin/main..HEAD` = **`src/Search/SearchService.php`만**
6. dirty stash/reset/clean/commit **금지**
7. `git push origin HEAD:main` (FF만 · force 금지)
8. Actions Deploy to dothome 대기. 로컬 `build:dothome` **실행 안 함**

---

## 2. Forbidden

```
git add · 새 커밋 · amend · rebase · force
study-room-reg/screens.js · docs/046·047·README
로컬 build:dothome · Notion
```

---

## 3. 운영 스모크

| # | 확인 |
|---|---|
| 1 | `POST /api/search/region-stats.php` `{}` → **200** · ok · 세 숫자(0 OK) · axes 대치동/서울시/서울시 |
| 2 | search tutor `tutor_region_label=서울시` → 200 |
| 3 | search student `preferred_region_label=서울시` → 200 |
| 4 | search room `region_label=대치동` → 200 유지 |
| 5 | `#/guest` 지도 박스 = API 실수 (「—」·47/62/128 아님) |

---

## 4. 보고

push 전후 origin/main SHA · Actions # · 파일 1개 · 스모크 1~5 · dirty 미커밋
