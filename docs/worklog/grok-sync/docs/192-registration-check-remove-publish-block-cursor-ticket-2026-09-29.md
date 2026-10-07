# 192 · Cursor — 등록점검 하단 「공개」블록 제거

- 작성: 2026-09-29 · 우동공과2
- 근거: 종현 잠금 — 「공개」는 옛 정책 잔재. 현재 용어는 **노출**(필수 입력 → 픽/프라임 노출). 카드에 「공개 조건」 없음.
- 선행: **189 수락 후** 착수 (지금은 지시문만 준비)
- push · build:dothome · Notion · commit **금지** (로컬만)

## Must

1. 과외쌤 마이 **등록점검** 하단에서 다음을 **통째로 제거**  
   - 「공개 조건이 충족…」류 요약  
   - 「공개 전 자기확인」체크 카드  
   - 「공개하기」/「다시 공개」버튼  
2. 등록점검에 남는 것: 필수 입력 현황(「부족 n」/「모든 필수 항목 입력 완료」), Pick·Prime **추가 입력·노출** 안내. **공개 조건·공개하기 CTA 없음.**
3. 공부방 등록점검은 이미 공개 CTA가 없으면 **잔여 문구만 확인·제거**. 새로 넣지 말 것.
4. `data-p21-publish` / confirm 체크 바인딩·죽은 카피가 화면에 안 남게 정리.
5. 용어: 등록점검에서 **공개**로 유도하지 말 것. 시장 보이기는 **노출**.

## Allowlist

- `preview/home-ui/src/tutor-reg/registration-check-render.js`
- `preview/home-ui/src/tutor-reg/registration-check-copy.js`
- `preview/home-ui/src/tutor-reg/screens.js` (publish 바인딩 최소)
- 필요 시 `registration-check-model.js` · `styles/registration-check.css` · `lifecycle-copy.js` 인용부
- 공부방: `preview/home-ui/src/study-room-reg/registration-check-*.js` (잔여만)

## Forbid

- Pick/Prime·필수 체크리스트 삭제
- 숨김(hide) API·관리자 노출 설정 전면 개편
- 189 대학 · 동네인사 · 마이페이지 좌측메뉴
- commit / push / `build:dothome`

## 스모크

1. 과외쌤 `#/mypage/registrations/tutors/{id}` 등록점검: 하단 공개 블록·공개하기 버튼 **0**
2. 「부족 n」/「모든 필수 항목 입력 완료」·픽/프라임 안내는 유지
3. 공부방 등록점검에도 공개하기 CTA 없음
4. 기본정보·상세 저장 회귀 없음

## 커밋 예 (수락·배포 지시 후)

`fix(reg-check): remove obsolete publish self-check CTA`
로컬만.
