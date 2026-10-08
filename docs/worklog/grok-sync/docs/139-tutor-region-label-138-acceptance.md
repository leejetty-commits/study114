# 139 · 138 과외 LIKE label 제거 — 로컬 수락

- 작성: 2026-09-25 05:33 KST
- 선행: [138](138-tutor-region-like-drop-label-fixup.md) · [137](137-region-stats-pdo-136-deploy-acceptance.md)
- 상태: **로컬 수락** · 배포 허가 → [140](140-tutor-region-label-138-deploy-ticket.md).
- 커밋: `f42d89e8a15dc55c852c973e0783e6b4a5dfd160`
- 부모: `db4cde2` (= 현재 origin/main)
- 메시지: `fix(search): match tutor regions on sido, sigungu, and dong only`
- 파일: `src/Search/SearchService.php`만 (+1/−1)

---

## 판정

138과 일치. `label`만 제거, 시·구·동·토큰·LIKE 의미 유지. dirty 미포함.

운영은 아직 `db4cde2` → 배포 후 스모크(tutor 서울시·region-stats·#/guest 실수).
