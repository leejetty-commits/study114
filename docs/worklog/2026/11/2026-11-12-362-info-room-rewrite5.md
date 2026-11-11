# 362 재작성 5차 — verify 상향 · 01~05 항목6·7 · 06~22 재작성 (2026-11-12)

## 지시 (승인)
- 브랜치: `work/362-info-room-content` (HEAD 당시 `49439364`)
- ① verify 보강: 영문·괄호꼬리표 정규화, 문장단위 3-gram 60% 글간·글내 FAIL, slug/파일명 FAIL, Q&A 뒤 ## ≥2 FAIL
- ② 01~05: 항목 6·7만 (04·05 표현). 02·03 폴더 금지
- ③ 06~22 전면 재작성: slug꼬리표·파일명문장·공통7문장·X2/X3사례·글내반복 제거; 사례1·Q&A뒤절≤1·틀다양; 15일·상가불가·조례Q&A·학원10명·교습소강사·반환5일/1과목
- 금지: 02·03·머지·force push·우회패딩
- 완료: 01~22 PASS + 실패샘플 FAIL → 보고 → push(머지없음)

## verify
- `scripts/verify-info-room-content.mjs` 5차 보강 반영
- 01-startup **22/22 PASS** (고유 with-space 2700~4000, noSp≥2000, 글간·글내 3-gram, slug/파일명, Q&A뒤절)

## 실패샘플 (FAIL 확인)
| 파일 | 의도 이슈 |
|---|---|
| `tmp/fail-samples/99-fail-slug-tail.md` | slug-tail · filename string |
| `tmp/fail-samples/98-fail-qa-after.md` | sections after Q&A ≥2 · near-dup sentences/paras |

## 본문
- 04·05: 항목6·7 표현만
- 06~22: 꼬리표·공통패딩 제거 후 고유 본문 재작성 (법령 통일 문장·우동공과 유지)

## 범위
- 코드/콘텐츠: verify + `01-startup` 04~22
- worklog: 본 문서
- 미포함: tmp/*.mjs 작업 스크립트, 02·03, main 머지
