# Notion 30장 §15 동기화 패치 (2026-07-07)

페이지: https://app.notion.com/p/f7f93339f165443c85fcee5577ef4d15

Notion MCP `update_content`로 §15 표 전체 또는 §20을 아래로 교체.

| ID | 이름 | 유형 | route / 진입 | 현재 상태 | 문서 상태 | 진입 규칙 | 비고 |
|----|------|------|--------------|:---------:|:---------:|:---------:|------|
| P09-01 | 비회원 메인 | page | `#/guest` | ✅ | UX 1차 | 공개 | 대치동 데모 |
| P09-02 | 학부모 메인 | page | `#/parent` | ✅ | UX 1차 | 공개 | 2탭 · provider-home |
| P09-03 | 공부방 메인 | page | `#/study-room` | ✅ | UX 1차 | study_room | 내 노출 + 학생찾기 |
| P09-04 | 과외쌤 메인 | page | `#/tutor` | ✅ | UX 1차 | tutor | 3지역 내 노출 |
| P15-01 | 마이페이지 홈 | page | `#/mypage/home` | ✅ | UX 1차 | 로그인 | 역할별 stat |
| P15-06 | 찜 | page | `#/mypage/wishlist` | ✅ | UX 1차 | 로그인 | 25 handoff |
| P15-07 | 최근열람 | page | `#/mypage/recent` | ✅ | UX 1차 | 로그인 | resume token |
| P15-08 | 쪽지 요약 | page | `#/mypage/messages` | ✅ | UX 1차 | 로그인 | → P16 |
| P15-09 | 유료 요약 | page | `#/mypage/plans` | ✅ | UX 1차 | 공급자 | P18 허브 · tier·ROI 미리보기 |
| P18-01 | 유료 서비스 안내 | page | `#/mypage/paid` | ✅ | 18§19 | 공급자 | 카탈로그 · 횟수권 배지 · dev PG (18d) |
| P18-02 | ROI·반응 요약 | page | `#/mypage/paid/usage` | ✅ | 18§6 | 공급자 | status API · 쪽지권·열람권 (18b~c) |
| P15-10 | 제출자료 상태 | page | `#/mypage/submission-docs` | ✅ | UX 1차 | 공급자 | 21·22·24 허브 |
| P15-11 | 계정/설정 | page | `#/mypage/account` | ✅ | UX 1차 | 로그인 | §5 |
| P16-01~04 | 쪽지함 | page/overlay | `#/mypage/messages/*` | ✅ | UX 1차 | 로그인 | API 014·015 · 쪽지권 게이트 |
| P17-01~03 | 고객센터 홈·안전 | page | `#/support · …/guide · …/safe` | ✅ | UX 1차 | 공개 | §7 |
| P17-04 | FAQ | page | `#/support/faq` | ✅ | UX 1차 | 공개 | 독립 page |
| P17-05 | 공지 | page | `#/support/notice` | ✅ | UX 1차 | 공개 | 독립 page |
| P17-07 | 운영문의·내역 | page | `#/support/contact · …/tickets` | ✅ | UX 1차 | 공개 | 독립 page |
| P19-01 | 학생 목록 | page | `#/mypage/registrations/students` | ✅ | UX 1차 | guardian | §8 |
| P19-02 | 학생 허브 | page | …/students/{id} | ✅ | UX 1차 | guardian |  |
| P19-03a/b | 기본·상세등록 | page | …/{id}/basic · …/detail | ✅ | UX 1차 | guardian |  |
| P19-04 | 학생 미리보기·공개 | page | …/{id}/publish | ✅ | UX 1차 | guardian |  |
| P19-05 | 학생 공개설정 | page | …/{id}/settings | ✅ | UX 1차 | guardian |  |
| P20-01 | 공부방 목록 | page | `#/mypage/registrations/study-rooms` | ✅ | UX 1차 | owner | 5175 브리지 |
| P20-02 | 공부방 허브 | page | …/study-rooms/{id} | ✅ | UX 1차 | owner |  |
| P20-03a/b | 기본·상세정보 | page | …/{id}/basic · …/detail | ✅ | UX 1차 | owner | 5175 |
| P20-04 | 미리보기·공개 | page | …/{id}/publish | ✅ | UX 1차 | owner | 공개 직전 확인 |
| P20-05 | 노출·상담 | page | …/{id}/exposure | ✅ | UX 1차 | owner | inquiry_status |
| P21-01 | 과외 목록 | page | `#/mypage/registrations/tutors` | ✅ | UX 1차 | tutor | 5177 브리지 |
| P21-02 | 과외 허브 | page | …/tutors/{id} | ✅ | UX 1차 | tutor |  |
| P21-03a/b | 기본·상세정보 | page | …/{id}/basic · …/detail | ✅ | UX 1차 | tutor | 5177 |
| P21-04 | 미리보기·공개 | page | …/{id}/publish | ✅ | UX 1차 | tutor | 4모드 |
| P21-05 | 학생 접근·쪽지 | page | …/{id}/access | ✅ | UX 1차 | tutor |  |
| P21-06 | 노출·부oost | page | …/{id}/exposure | ✅ | UX 1차 | tutor | Prime |
| P24-01 | 상세 Shell | modal | client state | ✅ | UX 1차 | viewer별 | hash URL ✕ |
| P24-02 | 공부방 상세 | block | (P24-01 내) | ✅ | UX 1차 | viewer별 | 필수 variant |
| P24-03 | 과외 상세 | block | (P24-01 내) | ✅ | UX 1차 | viewer별 | 필수 variant |
| P24-04 | 학습 요청 카드 | block | (P24-01 내) | ✅ | UX 1차 | viewer별 | paid_only 열람권 unlock (18c) |
| P25-00/04 | Compare Bar/Modal | block/modal | global | ✅ | handoff 2차 | 로그인 | API 013 |
| P25-S10 | 학생 검토함 | page | `#/mypage/student-review` | ✅ | 2차 ✅ | tutor/owner | P20·P21 브리지 |
| P26-01~07 | 정책·약관 | page | `#/policy/{slug}` | ✅ | UX 1차 | 공개 | P17-06→P26 |
| P23-01~03 | 자료실 | page | `#/library/*` | ✅ | 23장 | 공개 | boardKey |
| P23-04 | 제출함 허브 | page | `#/mypage/submission-board` | ✅ | 23장 | 공급자 | P15-10 브리지 |
| P23-04a/b | 제출 작성·상세 | page | …/new · …/:id | ✅ | 23장 | upload |  |
| P17-admin | 운영 프리뷰 | admin | `#/support/admin/*` | ✅ | 17c | 내부 |  |
| A28-01 | 운영 홈 | admin | `#/admin` | △ | 28§12 | 내부 | RED LINE |
| A28-04 | 신고 처리 | admin | `#/admin/reports` | △ | 28§5 | 내부 | 큐 API |
| A28-06 | 제출자료 확인 | admin | `#/admin/submission-docs` | △ | 28§3 | 내부 | submitted 큐 |
| A28-07 | 노출·권한 보정 | admin | `#/admin/exposure` | △ | 28§3-b | 내부 | 부록 F QA |
| A28-08 | 운영 로그 | admin | `#/admin/logs` | △ | 28§9 | 내부 |  |
