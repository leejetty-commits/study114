# 022 · 학생 마이페이지 리뉴얼 F — 수락 검토

- 작성일: 2026-09-24 (KST)
- 선행: [021](021-student-mypage-renewal-ticket-f-stage5b.md) · [003](003-global-design-manual.md)
- 대상: Cursor F 보고 (미커밋)
- 상태: **로컬 수락** (push / `build:dothome` 대기)

---

## 0. 한 줄 결론

021 기준으로 **학생 마이페이지·내 등록 4탭 + 셸** Stage5B 톤 패스는 로컬에서 닫혔다.  
추가 보완지시문은 없다. **A~F 1차 리뉴얼 분할은 로컬 수락까지 완료.**  
커밋·push·빌드는 요청 전 금지. 커밋 시 **F 3파일만** (auth·A~E dirty와 분리).

---

## 1. 파일

| 파일 | 역할 |
|------|------|
| `preview/home-ui/src/styles/student-mypage-stage5b.css` | **신규.** `.home-app--role-parent` 스코프 — 메뉴·탭·카드·폼·쪽지설정·공란 |
| `preview/home-ui/src/main.js` | 위 CSS import 1줄 |
| `preview/home-ui/src/styles/student-detail.css` | `.student-detail-hint`만 12px / `#4B5563` |

타역할 선택자 없음. `main.js`는 전역 import이나 **선택자가 role-parent로 가드.**

---

## 2. 021 체크

| 잠금 | 결과 |
|------|------|
| Primary `#266BC4` = 저장 CTA만 | 예 |
| 메뉴·탭 = 학생 soft + 선택선, 탭 배경 투명 | 예 |
| card12 / input8 / chip6 / badge4 | 예 |
| FS 12·14·16·18·22·28 (좁은 제목 22) | 예 |
| pill 텍스트 뱃지 없음 | 예 |
| 공란 = 회색 칸, 「필수」 마킹 없음 | 예 |
| 상세 안내 문장 미변경 | 예 |
| 쪽지설정 저장 버튼 없음 | 예 |
| 라우팅·금지어0·저장 스모크 원복 | 예 (보고) |
| 필드/API/전역 tokens/타역할 미손 | 예 |

비차단: `--s5-*` 로컬 hex 재선언 (값 = Stage5B TOKENS). 공용 `tokens.css` 변수 연결은 후속 chore.

---

## 3. 잔여 (F 미완료 아님 · 시리즈 밖)

1. 쪽지설정 **저장** / `memo_status` → **별도 티켓**
2. `GUARDIAN_PLANS_COPY` 개명 · dead publish API → chore 선택
3. A~E + F 커밋 시 **역할별 묶음 분리** (auth WIP 절대 혼합 금지)
4. push / `build:dothome` → 사용자 명시 요청 시에만
5. 찜·비교·쪽지·계정 **내용** 리뉴얼, 가입 14장, 학생찾기 배포 → 별도

---

## 4. 시리즈 상태

| 티켓 | 문서 | 상태 |
|------|------|------|
| A | 009·010 | 로컬 수락 |
| B | 011~013 | 로컬 수락 |
| C | 014·015 | 로컬 수락 |
| D | 016·017 | 로컬 수락 |
| E | 018~020 | 로컬 수락 |
| F | 021·022 | **로컬 수락** |
