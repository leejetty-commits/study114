# C-12 · 빈 상태·우측 레일·「—」 과다 카피

> 작성 2026-11-07 · 브랜치 `c12-empty-rail-copy`

## 지시서 원문

`study114-mode-sec-audit/cursor-handoff/C-12-빈상태-레일-카피.md`

## 수정 내역 (7파일)

| # | 항목 | 파일 | 변경 |
|---|---|---|---|
| 1 | 빈상태 CTA 맞춤 | empty-state-copy.js | wishlist CTA "공부방·과외쌤 찾아보기", compare "찜 목록 보기" |
| 2 | 「지금 필요한 안내」 역할 짝 | right-rail.js | actionGuideCopy에 ctx.navRole 전달, 역할별 eyebrow/title |
| 3 | 카드 「—」 과다 | exposure-render.js | slotOptional/renderHcardSlotOptional 추가, 학생·과외 선택 필드 숨김 |
| 4 | 고민방 레일 빈 문구 통일 | concern/copy.js | roomEmpty/hotEmpty/bestEmpty 간결화, 목록과 일관 |
| 5 | 프라임/픽 빈칸 카피 | exposure-rules.js | 학부모 빈칸에 방향 안내 body 추가 |
| 6 | 필드별 오류 표시 | signup-account-contact.js | 휴대폰 필드 아래 data-phone-error 추가, 필드별 오류 |
| 7 | 배너 같은 탭 이탈 | home-marketing-banner.js | search_student CTA external→hash nav (t877) |

## 미처리 항목

| # | 항목 | 사유 |
|---|---|---|
| 3-일부 | 플레이스홀더 사진 개선 | CSS/이미지 변경 필요, 카피 범위 밖 |
| 3-일부 | 자카드 식별 표시 | C-05 카드통계·자기카드와 겹침, 별도 과제 |

## 검수

- [ ] 사이트 구조 깨짐 없음 (PC + 모바일 390px)
- [ ] 빈 화면에 맞춤 CTA 표시
- [ ] 카드에서 빈 선택 필드가 「—」 없이 숨겨짐
- [ ] 승인
