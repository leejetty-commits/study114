# 151 · 과외쌤 쪽지설정 = 공부방 쪽지설정 (블록 감싸기·우측 이유)

- 날짜: 2026-09-25
- 상태: **ACCEPT 2026-09-28** · 수락서 `151-tutor-memo-settings-acceptance-2026-09-28.md` · next 161 (push / `build:dothome` 금지)
- 저장소: **오직** `leejetty-commits/study114` (다른 study114 저장소 사용 금지)
- 운영 스모크: 공부방 `…/study-rooms/7/inquiries` · 과외쌤 `…/tutors/9/inquiries`
- 샷: `/workspace/memo-settings-audit/room-memo-settings-*.png` · `tutor-memo-settings-*.png`

## 1. 사용자 잠금

1. 과외쌤 쪽지설정 페이지를 공부방과 같게. **중점 = 블록(둥근 흰 카드) 감싸기**.
2. 「쪽지 안받음」 **이유 = 우측** 배치 + **선택 반전 효과** (공부방 기준).
3. 코딩은 Cursor 켤 때. 배포는 사용자가 「배포」할 때만.

## 2. 깃 대조 결론 (더 복잡하지 않음 — 화면보다 원인 명확)

공부방은 이미 새 마크업·클래스가 있고, 과외쌤은 옛 세로 배치·카드 클래스 없음.

| | 공부방 (`study-room-reg/screens.js` 쪽지설정 본문) | 과외쌤 (`tutor-reg/inquiries-render.js`) |
|--|--|--|
| 현재상태 | `p21-inq-block--status` **+ `p20-inq-card`** | `p21-inq-block--status`만 (**카드 클래스 없음**) |
| 현재상태 수정 | `…--edit` **+ `p20-inq-card`** · 안쪽 `p20-inq-edit-grid` | `…--edit`만 · 그리드 없음 |
| 안받음 이유 | **우측** (`p20-inq-edit-grid` 오른쪽 / 받을 때는 `p20-inq-reason-empty`) | **아래** (선택 타일 밑 `p21-inq-reasons`) |
| 저장하기 | 수정 카드 **안** (왼쪽 열) | 수정 블록 **밖** (`p21-inq-save`) |
| 카드 샘플 | `p20-inq-sample` + `p20-inq-sample__surface` | `p21-inq-block--samples`만 |

반전(`is-selected` 배경)은 양쪽 타일 클래스 공유. 과외쌤에 부족한 것은 **카드 래퍼 클래스 + 우측 그리드 구조**.

## 3. Cursor allowlist (초안)

- `preview/home-ui/src/tutor-reg/inquiries-render.js` — 마크업을 공부방 `screens.js` 쪽지설정 구간과 같은 구조로 (클래스명 `p20-inq-*` 재사용 가능)
- 필요 시 `preview/home-ui/src/tutor-reg/inquiries-edit.js` — 우측 빈칸/숨김 동기화가 공부방 `syncStudyRoomReasonState`와 같게
- CSS는 공부방용 `p20-inq-*`가 이미 있으면 **재사용만**. 새 전역 스타일 남발 금지. (파일은 Cursor가 `p20-inq-card` 검색으로 확정)

**금지:** 학생 쪽지설정 · 저장 API/상태값 의미 변경 · 공부방 동작 후퇴 · push/`build:dothome` · 다른 GitHub 저장소.

## 4. 수락

- 과외쌤 쪽지설정에서 현재상태 / 현재상태 수정 / 카드 샘플이 공부방처럼 큰 흰 카드로 감싸짐.
- 안받음일 때 이유가 **오른쪽**, 선택 시 반전.
- 저장·새로고침 상태 일치. 배포 없음.
