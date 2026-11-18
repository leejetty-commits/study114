# 18 문서·노션 동기화

기준: `origin/main` `656bf4aa` (PR #269).
브랜치: `work/18-docs-sync`
작업 트리: `D:\work\study114\.wt\18-docs-sync`

코드·설정·DB는 바꾸지 않았다. 12b 작업기록 `2026-11-19-admin-stats-region-levels.md`는 이미 있어 수정하지 않았다.

## 고친 문서

- 15장: 증빙서류 제출 가능, 계정 이름, 홍보지역 2·3 지우기, 비밀번호 실패 한글 안내, 추가 정보 4줄.
- 48번: 제출함 문장 앞에 폐기 표시. 홈 카드 「제출자료 n개」 문자열은 없고, 상세 건수 표시는 남아 있다고 적음.
- 08장 42행: 제출함 사용 문장 뒤에 2026-11-19 기준을 붙임.
- 20장: 수업 그룹 월 수업료. 화면 천원, DB `monthly_fee_amount`는 원. 스키마 파일 `sql/schema/093_study_room_class_monthly_fee_amount.sql`은 #254에 있다.
- 30장: `#/admin/stats` 행. 첫 화면은 `/admin`.
- `docs/internal/admin-stats.md`, `docs/internal/open-after-backlog-2026-11.md` 신규.
- 17g·17h 작업기록 신규.

## 같이 적은 머지

#266 `bd8f9fc8`, #267 `b60ef7b4`, #268 `4f3a8bbe`, #269 `656bf4aa`.

## 12c

운영 regions의 「시 단위」 동 행 15행(id 4~18, 17개 시·도 중 서울·부산 제외) 삭제, 참조 0건 확인 후, 2026-11-19 종현 실행. 원인은 예전 SidoRegionEnsure(7a320f70), 67b9a63e 이후 재생성 없음. SQL 주석의 「2행」은 초기 오기다.

## 모바일

A1 #259, A2 #260, A3 #260, B1 #263은 해결로 적는다. B2·B3·B4는 확인 필요. C1~C4는 미착수. docs 브랜치 `17-mobile-audit.md`에 결과 표를 붙인다.

## Part 2

노션 반영은 이 커밋 다음이다. 결과는 채팅 보고에만 적고, 이 파일을 다시 고치지 않는다.
