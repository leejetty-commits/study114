# 359 2단계 — 환불 안내 문구 화면 반영

- 지시 정본: `docs/worklog/grok-sync/docs/359-refund-copy-unify-phase2-2026-11-13.md`
- 1단계: `docs/worklog/2026/11/2026-11-13-359-refund-copy-audit.md` · PR #195 이어감
- 브랜치: `work/359-refund-copy-unify` · 워크트리: `D:\work\study114\.wt\work-359-refund-copy-unify`
- **머지 안 함**

## 지시 요지

종현 확정 문구를 단일 모듈에 넣고 FAQ·스토어프론트·체크아웃·구매이력 패널·탈퇴 안내에 import. 356 연장 문장 원문 유지. 18c·18d·프로모·메일·관리자 미변경.

## 구현

| 파일 | 내용 |
|------|------|
| `preview/home-ui/src/refund-policy-copy.js` | **신규** 확정 문구·356 상수·FAQ·탈퇴 힌트·checkout note helper |
| `support/support-copy.js` | FAQ 교체 → `FAQ_PAID_VS_TUTOR_FEE_REFUND` |
| `plans/order-blocks.js` | 환불 접힘·구매전확인·환불기준 기본값 → 모듈 |
| `plans/screens.js` | 쪽지 메타 환불 줄 · 체크아웃 note · 결과 안내 · 환불 패널에 짧은/자세한 규정 |
| `mypage/screens.js` | 탈퇴 안내 → `WITHDRAW_REFUND_HINT` (노출에 7일 프레임 제거) |
| `mypage/mypage-copy.js` | 「환불 완료」라벨에 PG HOLD 주석만 (입금 전 UI는 기존 패널 HOLD 유지) |
| `RefundService.php` | **미변경** (`has_live_later_extension` 원문 유지) |

모듈 경로 선택: 지시 권장 `refund-policy-copy.js` 그대로 사용.

## 검증

- `약관 기준` / `운영문의로 묻` / `요청하시면 확인해 안내` → preview 소스 **0건**
- 356 문장: 모듈 상수 + `POSITION_REFUND_DETAIL`에 동일 원문 포함 · 서버 denyMessage 원문 유지
- 18c·18d·right-rail·promo-video-config diff **0**

## 캡처

`docs/worklog/2026/11/359-refund-copy-captures/p2-*-{1280,390}.png`  
스크립트: `capture-phase2.mjs` (실계정·비밀값 없음)

| 캡처 | 방식 |
|------|------|
| FAQ·약관 | 로컬 preview 실화면 (서버가 이 워크트리가 아닐 수 있음 → 소스 FAQ import로 확정) |
| 쪽지/노출 접힘·탈퇴 힌트 | 모듈 원문 렌더 |

## 발견 목록 (범위 밖 · 미수정)

1. 로컬 preview(5174)가 다른 워크트리일 수 있어 FAQ 실캡처는 배포/이 브랜치 미리보기에서 재확인 권장.
2. 관리자 `a28-copy` 탈퇴 안내의 옛 7일 문구는 고객 비노출 · 이번 대상 아님.

## 셀프검수 체크리스트

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | 문구 모듈 1곳, 화면은 import | PASS | `refund-policy-copy.js` |
| 2 | 확정 문구·356 원문 일치 | PASS | 상수 + DETAIL 삽입 · 서버 유지 |
| 3 | FAQ 교체, 「운영문의로 묻」없음 | PASS | support-copy + rg 0 |
| 4 | 「약관 기준」제거, 노출에 연장 안내 | PASS | order-blocks + DETAIL |
| 5 | 탈퇴 안내가 노출에 7일 프레임을 씌우지 않음 | PASS | WITHDRAW_REFUND_HINT |
| 6 | 「환불 완료」는 입금 전 비표시 | PASS | 패널 PG HOLD + approved≠환불완료 · 라벨 주석 |
| 7 | 18c·18d·프로모·푸터 미변경 | PASS | diff 0 |
| 8 | 캡처 1280·390 (테스트 계정·실명 없음) | PASS | p2-* · 실로그인 없음 |

## [최종검수 패키지 — 359-2단계]

```
[최종검수 패키지 — 359-2단계]
브랜치 / 커밋: work/359-refund-copy-unify / <push tip>
PR: https://github.com/leejetty-commits/study114/pull/195 (머지 안 함)
변경 파일: (git diff --stat origin/main...HEAD)
diff 요약:
  - refund-policy-copy.js: 확정 고객 문구 단일 모듈
  - support/order-blocks/plans/mypage: import로 교체·보완
  - docs: 2단계 지시·보고·캡처
테스트: rg 옛문구 0 · 356 원문 포함 · 제품 외 docs/ssot·프로모 0
스크린샷: docs/worklog/2026/11/359-refund-copy-captures/p2-*-{1280,390}.png
셀프검수 체크리스트: 위 표
미해결·종현 결정 필요: 없음
```
