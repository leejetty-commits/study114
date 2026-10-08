# 039 · 가입 티켓 4(037) 부분 수락 — 카피 통일

- 작성일: 2026-09-24 (KST)
- 대상: [037](037-signup-detail-optional-save-copy-ticket.md)
- 상태: **카피 축 수락** · 서버 null 미손댐은 의도적 보고로 수용 · 진행 의미는 [038](038-signup-detail-save-means-progress-policy.md)

---

## 수락

| 항목 | 결과 |
|------|------|
| 상세1·2 안내 통일 | 「지금 다 안 채워도 됩니다. 저장(다음)은 눌러 주세요」 |
| 파일 | `step-lesson.js` subtitle · `step-facility.js` guide |
| `*` Prime 유지 · 빈 저장 프론트 하드블록 없음 | 보고와 일치 |
| 서버 null / 스키마 | 미변경 (Cursor 명시) |
| 과외쌤 카피 | 미변경 |
| push | 안 함 |

## 사용자 추가 잠금 (038)

저장 안 누르고 창 닫기 ≠ 저장 ≠ 다음 화면 스킵.  
다음 로그인은 마지막 **성공 저장**의 `detail_completion_status` 기준.

## 잔여 (재현 시에만 티켓)

빈 칸으로 **저장을 눌렀을 때** 여전히 `curriculum cannot be null` 등이면 보완 지시.
