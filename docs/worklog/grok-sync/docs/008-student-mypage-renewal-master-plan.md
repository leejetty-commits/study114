# 008 · 학생 마이페이지 리뉴얼 — 마스터 계획

- 작성일: 2026-09-23 (KST)
- 상태: **A~F+G `20b7be8` main·닷홈 배포 완료** (잔여 [023](023-post-af-remaining-work-master.md) · 점검 [028](028-student-mypage-afg-deploy-ops-checklist.md))
- 디자인: [003](003-global-design-manual.md) · Stage5B (일상 UI, 홍보 예외 없음)

## 1. 정본 (노션)

| 역할 | 문서 |
|------|------|
| 학생 마이페이지 정본 | [학생 마이페이지 구조 및 프로필 입력 기준](https://app.notion.com/p/5b76f666474845128bf04e4aa9ac5486) |
| 학생 정책 개요 | [19장](https://app.notion.com/p/7eba881096b04f22a7eca438ea34b7b2) |
| 마이페이지 공통·학생 §2-2 | [15장](https://app.notion.com/p/fa61ab6064fa487987cbdcb12b651151) |
| 검수·공개 게이트 폐기 (횡단) | [공개·쪽지·노출 재잠금 2026-09-19](https://app.notion.com/p/fd8de59c1d404a8eb266814cf4c26e20) |

## 2. 컨셉 한 줄

학생 마이페이지는 **공개를 위한 검증 판이 아니다.**  
**내 정보가 어떻게 보이는지 확인하고 필요한 값만 고치는** 결과 확인형 구조다. Basic 카드 노출은 기본이며, 별도 공개설정 탭·부족 n개·공개 전 완료 UX를 걷어낸다.

## 3. 작업 분할 (순서 고정)

| 티켓 | 내용 | 문서 |
|------|------|------|
| **A** | IA·셸·1차 메뉴·내 등록 탭·라우팅 | [009](009-student-mypage-renewal-ticket-a-ia-shell.md) |
| **B** | 마이프로필 확인형 (실측 Basic 카드 + 리스트) | [011](011-student-mypage-renewal-ticket-b-myprofile.md) · [013](013-student-mypage-renewal-ticket-b-acceptance.md) |
| **C** | 기본정보 (Basic 핵심값·한 줄 요청문) | [014](014-student-mypage-renewal-ticket-c-basic.md) · [015](015-student-mypage-renewal-ticket-c-acceptance.md) |
| **D** | 상세정보 (확장·특이요청·카피) | [016](016-student-mypage-renewal-ticket-d-detail.md) · [017](017-student-mypage-renewal-ticket-d-acceptance.md) |
| **E** | 자녀/guardian/대표* 레거시 문법 청소 | [018](018-student-mypage-renewal-ticket-e-legacy-cleanup.md) · [019](019-student-mypage-renewal-ticket-e-fixup.md) · [020](020-student-mypage-renewal-ticket-e-acceptance.md) |
| **F** | 만진 화면만 Stage5B 디자인 패스 | [021](021-student-mypage-renewal-ticket-f-stage5b.md) · [022](022-student-mypage-renewal-ticket-f-acceptance.md) |

찜·비교·쪽지·계정 **내용** 리뉴얼, 가입 재개(14장), 학생찾기 필터와 **합치지 않음**.

## 4. 전 티켓 공통 규칙 (필수)

1. **범위 최소.** 티켓에 없는 파일·역할(공부방·과외쌤) 수정 금지.
2. **작업 마지막 = 라우팅 점검 + API 점검** 필수. 둘 다 증거(경로·요청·응답 요약)를 보고에 적을 것.
3. **예상외 오류·깨진 가정·티켓에 없는 연쇄 수정이 필요해지면 즉시 중단.**  
   코드를 덧대어 막지 말고, 현상·재현·의심 범위만 보고한 뒤 **사용자(우동공과2/종현) 승인 후**에만 재개.
4. push / `build:dothome`은 요청 전 금지. 로컬 커밋은 티켓 완료 시에만.
5. 우동공과2가 004식 검토 후 다음 티켓만 연다.
