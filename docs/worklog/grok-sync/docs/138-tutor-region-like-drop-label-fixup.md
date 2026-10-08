# 138 · 보완 — 과외쌤 지역 LIKE에서 없는 `label` 컬럼 제거

- 작성: 2026-09-25 05:31 KST
- 선행: [137](137-region-stats-pdo-136-deploy-acceptance.md) · 운영 #337
- 상태: **로컬 수락** → [139](139-tutor-region-label-138-acceptance.md) (`f42d89e`). 배포는 「배포」 후.
- 기준 HEAD: `db4cde2` (`origin/main`)
- push / build:dothome **허가 문구 없으면 금지**

---

## 0. 목표

손님 홈 지도 숫자·과외쌤찾기 「서울시」가 운영에서 **200**이 되게.

---

## 1. 원인 (확정)

`SearchService.php` 과외 `tutor_region_label` 분기:

```php
foreach (['sido_name', 'sigungu_name', 'dong_name', 'label'] as $i => $col)
```

`regions` 표에는 `label` 컬럼이 **없음** (001_init: sido/sigungu/dong만).  
PDO 이름 분리(134) 후 쿼리가 살아나며 Unknown column → 500.

학생·공부방은 `dong_name, sigungu_name, sido_name`만 — 정상.

---

## 2. 수정 (최소)

파일 **1개**: `src/Search/SearchService.php`

- 과외 분기 foreach를 **`['sido_name', 'sigungu_name', 'dong_name']`만** 쓰게 변경 (`label` 삭제).
- PDO 키는 기존 `tutor_region_like_a0`~`a2`로 자연히 3개.
- LIKE 토큰·`%token%`·EXISTS 구조·다른 탭 **변경 금지**.
- 스키마에 `label` 추가 **금지**.

---

## 3. Allowlist / Forbidden

Allowlist:
```
src/Search/SearchService.php
```

Forbidden: push·build:dothome(배포 전) · UI · dirty · 스키마 SQL · git add -A

---

## 4. 스모크

1. search tutor `tutor_region_label=서울시` → **200**
2. search student 서울시 · room 대치동 → 200 유지
3. `POST /api/search/region-stats.php` `{}` → **200** · 세 숫자
4. `#/guest` 지도 박스 = 실수

---

## 붙여넣기

```
[티켓 138 · 보완 · 과외쌤 regions.label 제거 · 지도/과외 500 · 로컬만 · push 금지]

※ HEAD db4cde2 · D:\work\study114 · git -c safe.directory=D:/work/study114
※ allowlist: src/Search/SearchService.php 만
※ 원인: tutor LIKE에 regions에 없는 label 컬럼. 스키마는 sido/sigungu/dong만.
※ 수정: foreach를 ['sido_name','sigungu_name','dong_name']만. label 삭제. 토큰·스키마·UI 금지.
※ 스모크: tutor 서울시 200, student/room 유지, POST region-stats 200, #/guest 실수
※ dirty·Notion·push·build:dothome 금지. 커밋 1개 로컬만.
※ 정본: docs/138 (box study114-ds)
```
