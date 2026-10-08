# 140 · 배포 — 과외 LIKE label 제거 (138 · f42d89e)

- 작성: 2026-09-25 05:34 KST
- 사용자 허가: 「배포」(위젯) → push · Deploy to dothome **허가**
- 로컬 수락: [139](139-tutor-region-label-138-acceptance.md)
- 현재: `origin/main` = `db4cde2` · HEAD = `f42d89e` · ahead 1
- 새 커밋·stage 없음. force 금지. DB 마이그 없음.
- 배포 결과: **수락** → [141](141-tutor-region-label-140-deploy-acceptance.md) · #338 · 지도 1/0/0

## 게이트
1. fetch · origin/main == `db4cde227b030b195a723c7ae7811302694dabe9` 아니면 중단
2. HEAD == `f42d89e8a15dc55c852c973e0783e6b4a5dfd160` 아니면 중단
3. log origin/main..HEAD = 1줄 `f42d89e fix(search): match tutor regions on sido, sigungu, and dong only`
4. diff name-only = `src/Search/SearchService.php`만
5. dirty 건드리지 말 것
6. `git push origin HEAD:main` (FF만)
7. Deploy to dothome 대기 · 로컬 build:dothome 금지

## 스모크
1. POST region-stats {} → 200 · 세 숫자
2. search tutor 서울시 → 200
3. student 서울시 · room 대치동 → 200 유지
4. #/guest 지도 박스 = 실수 (— · 47/62/128 아님)

## 보고
전후 SHA · Actions # · 파일1 · 스모크 · dirty 미커밋
