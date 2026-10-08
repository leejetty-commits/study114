# 020 · 학생 마이페이지 리뉴얼 E — 수락 검토

- 작성일: 2026-09-24 (KST)
- 선행: [018](018-student-mypage-renewal-ticket-e-legacy-cleanup.md) · [019](019-student-mypage-renewal-ticket-e-fixup.md)
- 대상: Cursor E + 019 보완 보고 (미커밋)
- 상태: **로컬 수락** (push / `build:dothome` 대기)

---

## 0. 한 줄 결론

018·019 기준으로 **자녀 / guardian(화면) / 대표학생 / 공개 게이트 / 스테퍼 / hope-dual** 레거시 문법은 학생 마이페이지·내 등록에서 닫혔다.  
변경 목록·auth WIP 분리가 019와 맞다. 추가 보완지시문은 없다. 다음 티켓은 **F(Stage5B 디자인 패스)** 만 연다.

---

## 1. E 최종 파일 (019 반영)

| 파일 | 역할 |
|------|------|
| `student-reg/screens.js` | 스테퍼·목록·게이트·자녀 카피·hope-dual 분기 제거 |
| `student-reg/student-reg-copy.js` | 자녀/공개 카피 상수 |
| `student-reg/store.js` | import 시 활성 학생 1명 가드 |
| `student-reg/hope-regions-ui.js` | **삭제** |
| `student-reg/router.js` | 레거시 list/publish → 마이프로필 · 탭 타이틀 |
| `mypage/screens.js` | 자녀 카피 · 잠긴 허브 → 프로필 |
| `mypage/router.js` | 자녀 목록 타이틀 |
| `mypage/preview-data.js` | 자녀/공개 미리보기 카피 |
| `mypage/index.js` | `#/mypage` → 마이프로필 |
| `mypage/shell.js` | 내 등록 → 허브 |
| `empty-state-copy.js` | 빈상태 자녀 카피 |
| `exposure-render.js` | selfView 카드 (B 연동) |
| `student-reg/format.js` | exposure row 특이요청 |
| `student-reg/profile-read.js` | 허브 리스트 (**신규·추적 대상**, 미커밋) |

**E 아님 (분리 유지):** auth-ui · Auth PHP · `StudentHubRepository.php`(선행 C/D) · study-room 노이즈 · `.tmp-*` · `_verify/` · teaser.

---

## 2. 018·019 체크

| 잠금 | 결과 |
|------|------|
| 학생 내 등록 금지어 0건 | 예 (보고·코드 검토) |
| list/tab/publish/`#/mypage` → students/{id} | 예 |
| 없는 학생 「학생 정보를 찾을 수 없습니다」 | 예 |
| student_import 1명 가드 | 예 |
| basic/detail 필드 분리 · 저장 스모크 원복 | 예 (019 재확인) |
| 계정설정 대표 지역 · 유료 대표 노출 유지 | 의도적 OK |
| 스키마·새 API·push/build/커밋 | 없음 |
| auth WIP와 E 목록 분리 | 예 (019) |

---

## 3. 잔여 (E 미완료 아님)

1. `GUARDIAN_PLANS_COPY` 심볼 개명 → F/chore 선택
2. store `getPublishReadiness` / `publishStudent` dead API → F 선택 삭제
3. 쪽지설정 저장 / `memo_status` → **별도 티켓**
4. 커밋 시 A~E mypage 관련만, auth·StudentHub는 분리
5. Stage5B → **F**

---

## 4. 다음

- **F**: [021](021-student-mypage-renewal-ticket-f-stage5b.md)
